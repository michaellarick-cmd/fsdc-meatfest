const { chromium } = require('playwright');

const LIVE_URL = process.env.MEATFEST_LIVE_URL || 'https://fsdc-meatfest.michael-larick.workers.dev/';

function fail(message) {
  throw new Error(message);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });

  try {
    const response = await page.goto(LIVE_URL, { waitUntil: 'networkidle', timeout: 60000 });
    if (!response || !response.ok()) {
      fail(`Cloudflare page request failed: ${response ? response.status() : 'no response'}`);
    }

    const title = await page.title();
    if (!title.includes('Meatfest')) fail(`Unexpected page title: ${title}`);

    await page.locator('#buffetServiceCard').waitFor({ state: 'visible', timeout: 30000 });

    const hotDogs = page.locator('button[data-buffet-key="supplementalIds"][data-buffet-id="hotdogs"]');
    if (await hotDogs.count() !== 1) fail('Hot Dogs buffet control is missing.');
    if (await hotDogs.getAttribute('aria-pressed') !== 'false') fail('Hot Dogs control did not start unselected.');
    await hotDogs.click();
    await page.waitForFunction(() => document.querySelector('button[data-buffet-key="supplementalIds"][data-buffet-id="hotdogs"]')?.getAttribute('aria-pressed') === 'true');
    if (!(await hotDogs.innerText()).includes('✓')) fail('Hot Dogs control did not render its selected state.');
    await hotDogs.click();
    await page.waitForFunction(() => document.querySelector('button[data-buffet-key="supplementalIds"][data-buffet-id="hotdogs"]')?.getAttribute('aria-pressed') === 'false');

    const cauliflower = page.locator('.sideCard').filter({ hasText: 'Cauliflower Mac' }).first();
    if (await cauliflower.count() !== 1) fail('Cauliflower Mac side control is missing.');
    if (!(await cauliflower.getAttribute('class') || '').includes('on')) await cauliflower.click();

    const collards = page.locator('.sideCard').filter({ hasText: 'Collard Greens' }).first();
    if (await collards.count() !== 1) fail('Collard Greens side control is missing.');
    if (!(await collards.getAttribute('class') || '').includes('on')) await collards.click();

    await page.waitForTimeout(100);

    const liveState = await page.evaluate(() => {
      const summary = window.buildSummary();
      const buffet = window.BuffetEngine;
      const sideRows = summary.sideRows || [];
      const sidePlan = buffet.sidePlan({
        sideIds: sideRows.map(r => r.id),
        proteinKeys: summary.rows.map(r => r.key),
        sideRows
      });
      const cauli = sideRows.find(r => r.id === 'cauli' || r.id === 'cauliflowerMac');
      const collards = sideRows.find(r => r.id === 'collards');
      const collardPlan = sidePlan.find(r => r.id === 'collards');
      const table = buffet.tableRequirement(102, { tableLengths: [72, 48] });
      const expectedCollardChafers = Math.max(1, Math.ceil((collards.q.amount * 0.75) - 1e-9));
      return {
        hasBuildSummary: typeof window.buildSummary === 'function',
        hasBuffetEngine: !!buffet,
        cauli,
        collards,
        collardService: collardPlan?.quantity?.service,
        expectedCollardChafers,
        table
      };
    });

    if (!liveState.hasBuildSummary || !liveState.hasBuffetEngine) fail('Required live Meatfest/Buffet globals are missing.');
    if (!liveState.cauli) fail('Cauliflower Mac was not handed from the live calculator into buffet state.');
    if (!liveState.collards) fail('Collard Greens were not handed from the live calculator into buffet state.');
    if (!liveState.collards.q || typeof liveState.collards.q !== 'object' || typeof liveState.collards.q.amount !== 'number' || !liveState.collards.q.unit) {
      fail(`Live Collard Greens quantity handoff is malformed: ${JSON.stringify(liveState.collards)}`);
    }
    if (!liveState.collardService || liveState.collardService.count !== liveState.expectedCollardChafers || liveState.collardService.label !== 'full chafer') {
      fail(`Live Collard Greens service calculation is wrong: ${JSON.stringify(liveState.collardService)}; expected ${liveState.expectedCollardChafers} full chafer(s).`);
    }
    if (!liveState.table || liveState.table.linearRequired !== 102 || liveState.table.linearProvided !== 120 || JSON.stringify(liveState.table.tables) !== JSON.stringify([72, 48])) {
      fail(`Live table requirement calculation is wrong: ${JSON.stringify(liveState.table)}`);
    }

    const buffetText = await page.locator('#buffetServiceCard').innerText();
    if (!buffetText.includes('Cauliflower Mac')) fail('Cauliflower Mac is missing from the live buffet presentation.');
    if (!buffetText.includes('Collard Greens')) fail('Collard Greens are missing from the live buffet presentation.');

    console.log('Cloudflare live smoke test passed.');
    console.log(JSON.stringify({
      url: LIVE_URL,
      title,
      cauliflowerMac: liveState.cauli.q,
      collards: liveState.collards.q,
      collardService: liveState.collardService,
      tableRequirement: liveState.table
    }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error.stack || error);
  process.exit(1);
});

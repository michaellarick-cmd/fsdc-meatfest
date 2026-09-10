const { chromium } = require('playwright');

const LIVE_URL = process.env.MEATFEST_LIVE_URL || 'https://fsdc-meatfest.michael-larick.workers.dev/';
function fail(message) { throw new Error(message); }
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  try {
    const response = await page.goto(LIVE_URL, { waitUntil: 'networkidle', timeout: 60000 });
    if (!response || !response.ok()) fail(`Cloudflare page request failed: ${response ? response.status() : 'no response'}`);
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
    const adults = page.locator('#adults'); const kids = page.locator('#kids');
    await adults.fill('40'); await adults.dispatchEvent('input'); await kids.fill('8'); await kids.dispatchEvent('input');
    for (const key of ['brisket', 'pmbe', 'ribs', 'pork', 'brats', 'chicken']) {
      const protein = page.locator(`.meat[data-k="${key}"]`); if (await protein.count() !== 1) fail(`Protein control is missing: ${key}`); if (!(await protein.evaluate(el => el.classList.contains('on')))) await protein.click();
    }
    const mac = page.locator('.sideCard[data-side="mac"]');
    if (await mac.count() !== 1) fail('Mac & Cheese side control is missing.');
    if (!(await mac.evaluate(el => el.classList.contains('on')))) await mac.click();
    const cauliflower = page.locator('.sideCard[data-side="cauli"]');
    if (await cauliflower.count() !== 1) fail('Cauliflower Mac side control is missing.');
    if (!(await cauliflower.evaluate(el => el.classList.contains('on')))) await cauliflower.click();
    const collards = page.locator('.sideCard[data-side="collards"]');
    if (await collards.count() !== 1) fail('Collard Greens side control is missing.');
    if (!(await collards.evaluate(el => el.classList.contains('on')))) await collards.click();
    await page.waitForTimeout(100);
    const liveState = await page.evaluate(() => {
      const summary = window.buildSummary(); const buffet = window.BuffetEngine; const sideRows = summary.sideRows || [];
      const sidePlan = buffet.sidePlan({ sideIds: sideRows.map(r => r.id), proteinKeys: summary.rows.map(r => r.key), sideRows });
      const cauli = sideRows.find(r => r.id === 'cauli' || r.id === 'cauliflowerMac'); const collards = sideRows.find(r => r.id === 'collards'); const collardPlan = sidePlan.find(r => r.id === 'collards');
      const table = buffet.tableRequirement([{ linearIn: 102 }], { tableLengths: [72, 48] }); const expectedCollardBowls = Math.max(1, Math.ceil(collards.q.amount - 1e-9));
      if (typeof window.populatePrint === 'function') window.populatePrint(); const printBuffet = document.querySelector('#psBuffet'); const printTables = printBuffet ? [...printBuffet.querySelectorAll('.ps-bTable')] : []; const printText = printBuffet?.innerText || '';
      return {hasBuildSummary:typeof window.buildSummary==='function',hasBuffetEngine:!!buffet,eaters:summary.eaters,proteinCount:summary.rows.length,purchaseWeight:summary.total,cauli,collards,collardService:collardPlan?.quantity?.service,collardVessel:collardPlan?.vessel,collardMethod:collardPlan?.service?.method,expectedCollardBowls,table,buffetText:document.querySelector('#buffetServiceCard')?.innerText||'',visualLayout:!!document.querySelector('#buffetLayoutCard .visualLayout'),printBuffet:!!printBuffet,printTableCount:printTables.length,printBuffetText:printText};
    });
    if (!liveState.hasBuildSummary || !liveState.hasBuffetEngine) fail('Required live Meatfest/Buffet globals are missing.');
    if (liveState.eaters !== 44) fail(`Live adult-equivalent eater count is wrong: ${liveState.eaters}`);
    if (liveState.proteinCount !== 6) fail(`Live canonical protein selection did not produce six proteins: ${JSON.stringify(liveState)}`);
    if (Math.abs(liveState.purchaseWeight - 86.125) > 0.0001 || Math.round(liveState.purchaseWeight * 10) / 10 !== 86.1) fail(`Live canonical purchase weight is wrong: ${liveState.purchaseWeight}; expected 86.125 lb raw / 86.1 lb displayed.`);
    if (!liveState.cauli || liveState.cauli.q.amount !== 0.75 || liveState.cauli.q.unit !== 'tin') fail(`Live Cauliflower Mac quantity is wrong: ${JSON.stringify(liveState.cauli)}`);
    if (!liveState.collards || !(liveState.collards.q.amount >= 1.25) || liveState.collards.q.unit !== 'recipe') fail(`Live Collard Greens quantity is wrong: ${JSON.stringify(liveState.collards)}`);
    if (!liveState.collardService || liveState.collardService.count !== liveState.expectedCollardBowls || liveState.collardService.label !== 'serving bowl') fail(`Live Collard Greens service calculation is wrong: ${JSON.stringify(liveState.collardService)}; expected ${liveState.expectedCollardBowls} serving bowl(s).`);
    if (!liveState.collardVessel || liveState.collardVessel.type !== 'bowl') fail(`Live Collard Greens vessel is wrong: ${JSON.stringify(liveState.collardVessel)}; expected serving bowl.`);
    if (liveState.collardMethod !== 'tongs') fail(`Live Collard Greens service method is wrong: ${liveState.collardMethod}; expected tongs.`);
    if (!liveState.table || liveState.table.linearRequired !== 102 || liveState.table.linearProvided !== 120 || JSON.stringify(liveState.table.tables) !== JSON.stringify([72,48])) fail(`Live table requirement calculation is wrong: ${JSON.stringify(liveState.table)}`);
    if (!liveState.buffetText.includes('Cauliflower Mac')) fail(`Cauliflower Mac is missing from the live buffet presentation. Live card text was: ${liveState.buffetText}`);
    if (!liveState.buffetText.includes('Collard Greens')) fail(`Collard Greens are missing from the live buffet presentation. Live card text was: ${liveState.buffetText}`);
    if (!liveState.visualLayout) fail('Live visual U-shaped buffet layout did not render.');
    if (!liveState.printBuffet || liveState.printTableCount !== 4) fail(`Printable buffet layout is missing or incomplete: ${JSON.stringify({printBuffet:liveState.printBuffet,printTableCount:liveState.printTableCount})}`);
    if (!liveState.printBuffetText.includes("3 × 6'") || !liveState.printBuffetText.includes('66 sq ft') || !liveState.printBuffetText.includes("4' • END")) fail(`Printable buffet layout metadata is wrong: ${liveState.printBuffetText}`);
    console.log('Cloudflare live smoke test passed.');
    console.log(JSON.stringify({url:LIVE_URL,title,eaters:liveState.eaters,proteinCount:liveState.proteinCount,purchaseWeight:liveState.purchaseWeight,cauliflowerMac:liveState.cauli.q,collards:liveState.collards.q,collardService:liveState.collardService,collardVessel:liveState.collardVessel,collardMethod:liveState.collardMethod,tableRequirement:liveState.table,visualLayout:liveState.visualLayout,printBuffet:liveState.printBuffet,printTableCount:liveState.printTableCount},null,2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error.stack || error); process.exit(1); });

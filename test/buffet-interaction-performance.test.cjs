const { chromium } = require('playwright');
const LIVE_URL = process.env.MEATFEST_LIVE_URL || 'https://fsdc-meatfest.michael-larick.workers.dev/';
const fail = message => { throw new Error(message); };
(async () => {
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage({viewport:{width:1440,height:1200}});
  try {
    const response = await page.goto(LIVE_URL,{waitUntil:'networkidle',timeout:60000});
    if(!response || !response.ok()) fail(`Cloudflare page request failed: ${response ? response.status() : 'no response'}`);
    await page.locator('#buffetServiceCard').waitFor({state:'attached',timeout:30000});
    const selections=[['burgers','Burgers'],['hotdogs','Hot Dogs'],['brats','Grilling Brats']];
    const timings=[];
    for(const [id,label] of selections){
      const button=page.locator(`button[data-buffet-key="supplementalIds"][data-buffet-id="${id}"]`);
      if(await button.count()!==1) fail(`${label} buffet control is missing.`);
      if(await button.getAttribute('aria-pressed')!=='false') fail(`${label} control did not start unselected.`);
      const start=Date.now();
      await button.click();
      await page.waitForFunction(expected=>document.querySelector(`button[data-buffet-key="supplementalIds"][data-buffet-id="${expected}"]`)?.getAttribute('aria-pressed')==='true',id,{timeout:10000});
      await page.locator('#buffetLayoutCard .mf-flow:has(.mf-flow-route)').waitFor({state:'attached',timeout:10000});
      const elapsed=Date.now()-start;
      const health=await page.evaluate(()=>{const service=document.getElementById('buffetServiceCard'),layout=document.getElementById('buffetLayoutCard');const rect=s=>s?.getBoundingClientRect();const sr=rect(service),lr=rect(layout);return{serviceHeight:sr?.height||0,layoutHeight:lr?.height||0,scrollHeight:document.documentElement.scrollHeight,visual:document.querySelectorAll('#buffetLayoutCard .mf-visual').length,execution:document.querySelectorAll('#buffetLayoutCard .mf-execution').length,physical:document.querySelectorAll('#buffetLayoutCard .mf-physical').length,flow:document.querySelectorAll('#buffetLayoutCard .mf-flow:has(.mf-flow-route)').length};});
      if(elapsed>5000) fail(`${label} selection took ${elapsed}ms to complete.`);
      if(health.serviceHeight<100||health.layoutHeight<100||health.scrollHeight<500) fail(`${label} selection left an invalid page layout: ${JSON.stringify(health)}`);
      if(health.visual!==1||health.execution!==1||health.physical!==1||health.flow!==1) fail(`${label} selection produced duplicate or missing buffet render blocks: ${JSON.stringify(health)}`);
      timings.push({label,elapsed,health});
    }
    const final=timings[timings.length-1].elapsed,first=timings[0].elapsed;
    if(final>Math.max(3000,first*3)) fail(`Buffet interaction time degraded excessively: first=${first}ms final=${final}ms.`);
    console.log('Cloudflare buffet interaction performance test passed.');
    console.log(JSON.stringify({url:LIVE_URL,selections:timings},null,2));
  } finally { await browser.close(); }
})().catch(error=>{console.error(error.stack||error);process.exit(1);});

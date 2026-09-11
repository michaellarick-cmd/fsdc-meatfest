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
    const selections=[
      ['supplementalIds','burgers','Burgers'],
      ['supplementalIds','hotdogs','Hot Dogs'],
      ['supplementalIds','brats','Grilling Brats'],
      ['condimentIds','bbqSauce','BBQ Sauce'],
      ['dessertIds','cobbler','Cobbler / Crisp'],
      ['dessertIds','pudding','Pudding / Cream Dessert'],
      ['dessertIds','pie','Pie'],
      ['dessertIds','cake','Cake'],
      ['dessertIds','cookies','Cookies / Bars']
    ];
    const timings=[];
    const selected=[];
    for(const [key,id,label] of selections){
      const button=page.locator(`button[data-buffet-key="${key}"][data-buffet-id="${id}"]`);
      if(await button.count()!==1) fail(`${label} buffet control is missing.`);
      if(await button.getAttribute('aria-pressed')!=='false') fail(`${label} control did not start unselected.`);
      const start=Date.now();
      await button.click();
      await page.waitForFunction(({key,id})=>document.querySelector(`button[data-buffet-key="${key}"][data-buffet-id="${id}"]`)?.getAttribute('aria-pressed')==='true',{key,id},{timeout:10000});
      await page.waitForFunction(()=>document.querySelectorAll('#buffetLayoutCard > .mf-visual').length===1&&document.querySelectorAll('#buffetLayoutCard > .mf-execution').length===1&&document.querySelectorAll('#buffetLayoutCard > .mf-physical').length===1&&document.querySelectorAll('#buffetLayoutCard > .mf-flow:has(.mf-flow-route)').length===1,{timeout:15000});
      selected.push([key,id]);
      const state=await page.evaluate(expected=>{const active=[];for(const [key,id] of expected){const b=document.querySelector(`button[data-buffet-key="${key}"][data-buffet-id="${id}"]`);if(b?.getAttribute('aria-pressed')==='true')active.push([key,id]);}return active;},selected);
      if(state.length!==selected.length) fail(`${label} selection lost prior choices: expected ${JSON.stringify(selected)}, actual ${JSON.stringify(state)}.`);
      for(const [expectedKey,expectedId] of selected){
        const b=page.locator(`button[data-buffet-key="${expectedKey}"][data-buffet-id="${expectedId}"]`);
        if(await b.getAttribute('aria-pressed')!=='true') fail(`${label} selection lost ${expectedId}.`);
      }
      const elapsed=Date.now()-start;
      const health=await page.evaluate(()=>{const service=document.getElementById('buffetServiceCard'),layout=document.getElementById('buffetLayoutCard');const rect=s=>s?.getBoundingClientRect();const sr=rect(service),lr=rect(layout);return{serviceHeight:sr?.height||0,layoutHeight:lr?.height||0,scrollHeight:document.documentElement.scrollHeight,visual:document.querySelectorAll('#buffetLayoutCard > .mf-visual').length,execution:document.querySelectorAll('#buffetLayoutCard > .mf-execution').length,physical:document.querySelectorAll('#buffetLayoutCard > .mf-physical').length,flow:document.querySelectorAll('#buffetLayoutCard > .mf-flow:has(.mf-flow-route)').length};});
      if(elapsed>5000) fail(`${label} selection took ${elapsed}ms to complete.`);
      if(health.serviceHeight<100||health.layoutHeight<100||health.scrollHeight<500) fail(`${label} selection left an invalid page layout: ${JSON.stringify(health)}`);
      if(health.visual!==1||health.execution!==1||health.physical!==1||health.flow!==1) fail(`${label} selection produced duplicate or missing buffet render blocks: ${JSON.stringify(health)}`);
      timings.push({label,elapsed,selectedCount:state.length,health});
    }
    const final=timings[timings.length-1].elapsed,first=timings[0].elapsed;
    if(final>Math.max(3000,first*3)) fail(`Buffet interaction time degraded excessively: first=${first}ms final=${final}ms.`);
    console.log('Cloudflare full buffet selection regression passed.');
    console.log(JSON.stringify({url:LIVE_URL,selections:timings},null,2));
  } finally { await browser.close(); }
})().catch(error=>{console.error(error.stack||error);process.exit(1);});

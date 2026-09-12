const { chromium } = require('playwright');
const LIVE_URL = process.env.MEATFEST_LIVE_URL || 'https://fsdc-meatfest.michael-larick.workers.dev/';
const fail = message => { throw new Error(message); };
(async () => {
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage({viewport:{width:1440,height:1200}});
  try {
    const response = await page.goto(LIVE_URL,{waitUntil:'domcontentloaded',timeout:60000});
    if(!response || !response.ok()) fail(`Cloudflare page request failed: ${response ? response.status() : 'no response'}`);
    await page.locator('#buffetServiceCard').waitFor({state:'attached',timeout:30000});
    await page.locator('#buffetLayoutCard').waitFor({state:'attached',timeout:30000});
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
      await page.waitForFunction(({key,id})=>document.querySelector(`button[data-buffet-key="${key}"][data-buffet-id="${id}"]`)?.getAttribute('aria-pressed')==='true',{key,id},{timeout:3000});
      const elapsed=Date.now()-start;
      if(elapsed>1000) fail(`${label} selection was not immediately responsive: ${elapsed}ms.`);
      selected.push([key,id]);
      for(const [expectedKey,expectedId] of selected){
        const b=page.locator(`button[data-buffet-key="${expectedKey}"][data-buffet-id="${expectedId}"]`);
        if(await b.getAttribute('aria-pressed')!=='true') fail(`${label} selection lost ${expectedId}.`);
      }
      await page.waitForFunction(()=>document.querySelector('#buffetDynamic')?.textContent.includes('service')||document.querySelector('#buffetDynamic')?.querySelector('.buffetRow'),{timeout:15000});
      const health=await page.evaluate(()=>({
        serviceHeight:document.getElementById('buffetServiceCard')?.getBoundingClientRect().height||0,
        layoutHeight:document.getElementById('buffetLayoutCard')?.getBoundingClientRect().height||0,
        scrollHeight:document.documentElement.scrollHeight,
        dynamicRows:document.querySelectorAll('#buffetDynamic .buffetRow').length,
        layoutTables:document.querySelectorAll('#buffetLayoutDynamic .layoutTable').length,
        controls:document.querySelectorAll('#buffetServiceCard button[data-buffet-key]').length
      }));
      if(health.serviceHeight<100||health.layoutHeight<100||health.scrollHeight<500) fail(`${label} selection left an invalid page layout: ${JSON.stringify(health)}`);
      if(health.layoutTables!==4) fail(`${label} selection produced an invalid main buffet layout: ${JSON.stringify(health)}`);
      if(health.controls<10) fail(`${label} selection lost buffet controls: ${JSON.stringify(health)}`);
      timings.push({label,elapsed,selectedCount:selected.length,health});
    }
    const final=timings[timings.length-1].elapsed,first=timings[0].elapsed;
    if(final>Math.max(1000,first*5)) fail(`Buffet interaction time degraded excessively: first=${first}ms final=${final}ms.`);
    console.log('Cloudflare full buffet selection regression passed.');
    console.log(JSON.stringify({url:LIVE_URL,selections:timings},null,2));
  } finally { await browser.close(); }
})().catch(error=>{console.error(error.stack||error);process.exit(1);});

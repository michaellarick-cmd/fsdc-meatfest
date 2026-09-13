const { chromium, webkit } = require('playwright');
const LIVE_URL = process.env.MEATFEST_LIVE_URL || 'https://fsdc-meatfest.michael-larick.workers.dev/';
const BROWSER_NAME = process.env.MEATFEST_BROWSER || 'chromium';
const fail = message => { throw new Error(message); };

(async()=>{
  const browserType=BROWSER_NAME==='webkit'?webkit:chromium;
  const browser=await browserType.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const page=await context.newPage();
  try{
    const response=await page.goto(LIVE_URL,{waitUntil:'domcontentloaded',timeout:60000});
    if(!response||!response.ok())fail(`${BROWSER_NAME} page request failed: ${response?response.status():'no response'}`);
    await page.addStyleTag({content:'html{scroll-behavior:auto !important}'});
    await page.locator('#buffetServiceCard').waitFor({state:'attached',timeout:30000});
    await page.locator('[data-side="rolls"]').waitFor({state:'attached',timeout:30000});
    await page.locator('[data-side="cornbread"]').waitFor({state:'attached',timeout:30000});

    for(const [id,label] of [['burgers','Burgers'],['brats','Grilling Brats']]){
      const b=page.locator(`button[data-k="supplemental"][data-id="${id}"]`);
      await b.scrollIntoViewIfNeeded();
      const before=await page.evaluate(()=>({top:scrollY,height:document.documentElement.scrollHeight}));
      await b.tap();
      await page.waitForFunction(id=>document.querySelector(`button[data-k="supplemental"][data-id="${id}"]`)?.getAttribute('aria-pressed')==='true',id,{timeout:3000});
      await page.waitForTimeout(500);
      const after=await page.evaluate(()=>({top:scrollY,height:document.documentElement.scrollHeight}));
      if(Math.abs(after.top-before.top)>100)fail(`${BROWSER_NAME}: ${label} real touch caused scroll jump (${before.top} -> ${after.top}).`);
      if(after.height<before.height-10)fail(`${BROWSER_NAME}: ${label} real touch reduced document geometry (${before.height} -> ${after.height}).`);
    }

    for(const [id,label] of [['rolls','Hawaiian Rolls'],['cornbread','Cornbread']]){
      const card=page.locator(`[data-side="${id}"]`);
      const handle=await card.elementHandle();
      if(!handle)fail(`${BROWSER_NAME}: ${label} side card is missing.`);
      await card.evaluate(el=>el.scrollIntoView({block:'center',inline:'nearest'}));
      await card.tap();
      await page.waitForFunction(id=>document.querySelector(`[data-side="${id}"]`)?.classList.contains('on'),id,{timeout:3000});
      const stable=await handle.evaluate((el,id)=>el.isConnected&&el===document.querySelector(`[data-side="${id}"]`),id);
      if(!stable)fail(`${BROWSER_NAME}: ${label} side-card DOM node was replaced during the real tap.`);
      const buffetBreadId=id==='rolls'?'hawaiian':'cornbread';
      await page.waitForFunction(id=>document.querySelector(`button[data-k="bread"][data-id="${id}"]`)?.getAttribute('aria-pressed')==='true',buffetBreadId,{timeout:3000});
    }

    const sauce=page.locator('button[data-k="condiment"][data-id="bbqSauce"]');
    await sauce.evaluate(el=>el.scrollIntoView({block:'center',inline:'nearest'}));
    await sauce.tap();
    await page.waitForFunction(()=>document.querySelector('button[data-k="condiment"][data-id="bbqSauce"]')?.getAttribute('aria-pressed')==='true',{timeout:3000});
    await page.waitForTimeout(500);

    const health=await page.evaluate(()=>({
      rolls:document.querySelector('[data-side="rolls"]')?.classList.contains('on'),
      cornbread:document.querySelector('[data-side="cornbread"]')?.classList.contains('on'),
      buffetRolls:document.querySelector('button[data-k="bread"][data-id="hawaiian"]')?.getAttribute('aria-pressed'),
      buffetCornbread:document.querySelector('button[data-k="bread"][data-id="cornbread"]')?.getAttribute('aria-pressed'),
      bbqSauce:document.querySelector('button[data-k="condiment"][data-id="bbqSauce"]')?.getAttribute('aria-pressed'),
      scrollHeight:document.documentElement.scrollHeight,
      tables:document.querySelectorAll('#buffetLayoutDynamic .b9table').length,
      dynamicRows:document.querySelectorAll('#buffetDynamic .b9row').length
    }));
    if(!health.rolls||!health.cornbread||health.buffetRolls!=='true'||health.buffetCornbread!=='true'||health.bbqSauce!=='true')fail(`${BROWSER_NAME}: state did not survive real touch sequence: ${JSON.stringify(health)}`);
    if(health.scrollHeight<500||health.tables<8||health.dynamicRows<15)fail(`${BROWSER_NAME}: page/layout degraded after real touch sequence: ${JSON.stringify(health)}`);
    console.log(`${BROWSER_NAME} real-touch Buffet + side-card stability regression passed.`);
    console.log(JSON.stringify({browser:BROWSER_NAME,url:LIVE_URL,sequence:['Burgers','Grilling Brats','Hawaiian Rolls','Cornbread','BBQ Sauce'],health},null,2));
  }finally{await context.close();await browser.close()}
})().catch(error=>{console.error(error.stack||error);process.exit(1)});

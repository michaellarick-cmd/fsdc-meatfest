const { chromium, webkit } = require('playwright');
const LIVE_URL = process.env.MEATFEST_LIVE_URL || 'https://fsdc-meatfest.michael-larick.workers.dev/';
const BROWSER_NAME = process.env.MEATFEST_BROWSER || 'chromium';
const fail = message => { throw new Error(message); };

(async()=>{
  const browserType=BROWSER_NAME==='webkit'?webkit:chromium;
  const browser=await browserType.launch({headless:true});
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true});
  try{
    const response=await page.goto(LIVE_URL,{waitUntil:'domcontentloaded',timeout:60000});
    if(!response||!response.ok())fail(`${BROWSER_NAME} page request failed: ${response?response.status():'no response'}`);
    await page.locator('#buffetServiceCard').waitFor({state:'attached',timeout:30000});
    await page.locator('[data-side="rolls"]').waitFor({state:'attached',timeout:30000});
    await page.locator('[data-side="cornbread"]').waitFor({state:'attached',timeout:30000});

    for(const [key,id,label] of [['supplemental','burgers','Burgers'],['supplemental','brats','Grilling Brats']]){
      const b=page.locator(`button[data-k="${key}"][data-id="${id}"]`);
      await b.evaluate(el=>el.scrollIntoView({block:'center',inline:'nearest'}));
      await b.evaluate(el=>el.click());
      await page.waitForFunction(({key,id})=>document.querySelector(`button[data-k="${key}"][data-id="${id}"]`)?.getAttribute('aria-pressed')==='true',{key,id},{timeout:3000});
    }

    for(const [id,label] of [['rolls','Hawaiian Rolls'],['cornbread','Cornbread']]){
      const card=page.locator(`[data-side="${id}"]`);
      const handle=await card.elementHandle();
      if(!handle)fail(`${BROWSER_NAME}: ${label} side card is missing.`);
      await card.evaluate(el=>el.scrollIntoView({block:'center',inline:'nearest'}));
      await card.evaluate(el=>el.click());
      await page.waitForFunction(id=>document.querySelector(`[data-side="${id}"]`)?.classList.contains('on'),id,{timeout:3000});
      const stable=await handle.evaluate(el=>el.isConnected&&el===document.querySelector(`[data-side="${id}"]`));
      if(!stable)fail(`${BROWSER_NAME}: ${label} side-card DOM node was replaced during selection.`);
      const buffetBreadId=id==='rolls'?'hawaiian':'cornbread';
      await page.waitForFunction(id=>document.querySelector(`button[data-k="bread"][data-id="${id}"]`)?.getAttribute('aria-pressed')==='true',buffetBreadId,{timeout:3000});
    }

    const rolls=await page.locator('[data-side="rolls"]').elementHandle();
    const cornbread=await page.locator('[data-side="cornbread"]').elementHandle();
    if(!rolls||!cornbread)fail(`${BROWSER_NAME}: bread side cards disappeared.`);
    if(!(await rolls.evaluate(el=>el.classList.contains('on')))||!(await cornbread.evaluate(el=>el.classList.contains('on'))))fail(`${BROWSER_NAME}: Hawaiian Rolls or Cornbread lost its selected state.`);

    const sauce=page.locator('button[data-k="condiment"][data-id="bbqSauce"]');
    await sauce.evaluate(el=>el.scrollIntoView({block:'center',inline:'nearest'}));
    await sauce.evaluate(el=>el.click());
    await page.waitForFunction(()=>document.querySelector('button[data-k="condiment"][data-id="bbqSauce"]')?.getAttribute('aria-pressed')==='true',{timeout:3000});
    await page.waitForTimeout(500);

    const health=await page.evaluate(()=>({
      alive:true,
      rolls:document.querySelector('[data-side="rolls"]')?.classList.contains('on'),
      cornbread:document.querySelector('[data-side="cornbread"]')?.classList.contains('on'),
      buffetRolls:document.querySelector('button[data-k="bread"][data-id="hawaiian"]')?.getAttribute('aria-pressed'),
      buffetCornbread:document.querySelector('button[data-k="bread"][data-id="cornbread"]')?.getAttribute('aria-pressed'),
      bbqSauce:document.querySelector('button[data-k="condiment"][data-id="bbqSauce"]')?.getAttribute('aria-pressed'),
      scrollHeight:document.documentElement.scrollHeight,
      tables:document.querySelectorAll('#buffetLayoutDynamic .b9table').length
    }));
    if(!health.rolls||!health.cornbread||health.buffetRolls!=='true'||health.buffetCornbread!=='true'||health.bbqSauce!=='true')fail(`${BROWSER_NAME}: source-of-truth side/bread state did not survive BBQ Sauce selection: ${JSON.stringify(health)}`);
    if(health.scrollHeight<500||health.tables<1)fail(`${BROWSER_NAME}: page/layout degraded after side + condiment sequence: ${JSON.stringify(health)}`);
    console.log(`${BROWSER_NAME} side-card stability regression passed.`);
    console.log(JSON.stringify({browser:BROWSER_NAME,url:LIVE_URL,sequence:['Burgers','Grilling Brats','Hawaiian Rolls','Cornbread','BBQ Sauce'],health},null,2));
  }finally{await browser.close()}
})().catch(error=>{console.error(error.stack||error);process.exit(1)});

const { chromium, webkit } = require('playwright');
const LIVE_URL = process.env.MEATFEST_LIVE_URL || 'https://fsdc-meatfest.michael-larick.workers.dev/';
const BROWSER_NAME = process.env.MEATFEST_BROWSER || 'chromium';
const VIEWPORT_HEIGHT = 844;
const fail = message => { throw new Error(message); };

(async()=>{
  const browser=await (BROWSER_NAME==='webkit'?webkit:chromium).launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:VIEWPORT_HEIGHT},deviceScaleFactor:2,isMobile:true});
  const page=await context.newPage();
  await page.addInitScript(()=>{
    const NativeWorker=window.Worker;
    window.__meatfestWorkerPosts=0;
    window.__meatfestWorkerDelayMs=0;
    window.Worker=class extends NativeWorker{
      postMessage(...args){
        window.__meatfestWorkerPosts++;
        const delay=Number(window.__meatfestWorkerDelayMs)||0;
        if(!delay)return super.postMessage(...args);
        return setTimeout(()=>super.postMessage(...args),delay);
      }
    };
  });
  try{
    const response=await page.goto(LIVE_URL,{waitUntil:'domcontentloaded',timeout:60000});
    if(!response||!response.ok())fail(`${BROWSER_NAME} Cloudflare page request failed: ${response?response.status():'no response'}`);
    await page.addStyleTag({content:'html{scroll-behavior:auto !important}'});
    await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
    await page.waitForTimeout(100);
    await page.locator('#buffetServiceCard').waitFor({state:'attached',timeout:30000});
    await page.locator('#buffetLayoutCard').waitFor({state:'attached',timeout:30000});
    await page.waitForFunction(()=>document.querySelector('#buffetLayoutDynamic .b9table b')&&!/waiting for plan/.test(document.querySelector('#buffetLayoutDynamic .b9table b').textContent||''),{timeout:15000});
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.waitForTimeout(300);
    const button=page.locator('button[data-k="supplemental"][data-id="burgers"]');
    if(await button.count()!==1)fail(`${BROWSER_NAME}: Burgers control is missing.`);
    await button.evaluate(el=>el.scrollIntoView({block:'center',inline:'nearest'}));
    await page.waitForTimeout(50);
    if(await button.getAttribute('aria-pressed')!=='false')fail(`${BROWSER_NAME}: Burgers control did not start unselected.`);
    await page.evaluate(()=>{window.__meatfestWorkerDelayMs=350;});
    await button.evaluate(el=>el.click());
    await page.waitForFunction(()=>document.querySelector('button[data-k="supplemental"][data-id="burgers"]')?.getAttribute('aria-pressed')==='true',{timeout:3000});
    const trace=[];
    const start=Date.now();
    for(let i=0;i<30;i++){
      await page.evaluate(()=>window.scrollBy(0,260));
      await page.waitForTimeout(30);
      trace.push(await page.evaluate(()=>({y:window.scrollY,h:document.documentElement.scrollHeight})));
    }
    const elapsed=Date.now()-start;
    const maxY=Math.max(...trace.map(x=>x.y));
    const backwardJumps=[];
    for(let i=1;i<trace.length;i++)if(trace[i].y<trace[i-1].y-500)backwardJumps.push({from:trace[i-1].y,to:trace[i].y,at:i});
    const final=trace[trace.length-1];
    const expectedMax=Math.max(0,final.h-VIEWPORT_HEIGHT);
    if(backwardJumps.length)fail(`${BROWSER_NAME}: scroll position jumped backward during worker completion: ${JSON.stringify(backwardJumps)} trace=${JSON.stringify(trace)}`);
    if(maxY<expectedMax-300)fail(`${BROWSER_NAME}: scroll/render race lost the page position: maxY=${maxY} expectedMax=${expectedMax} trace=${JSON.stringify(trace)}`);
    await page.waitForTimeout(300);
    const health=await page.evaluate(()=>({scrollY:window.scrollY,scrollHeight:document.documentElement.scrollHeight,viewportHeight:window.innerHeight,selected:document.querySelector('button[data-k="supplemental"][data-id="burgers"]')?.getAttribute('aria-pressed'),rows:document.querySelectorAll('#buffetDynamic .b9row').length,tables:document.querySelectorAll('#buffetLayoutDynamic .b9table').length,controls:document.querySelectorAll('#buffetServiceCard button[data-k]').length}));
    if(health.selected!=='true'||health.rows<15||health.tables!==8||health.controls<10)fail(`${BROWSER_NAME}: Buffet DOM/state was damaged by scroll-time rendering: ${JSON.stringify(health)}`);
    if(elapsed>3000)fail(`${BROWSER_NAME}: mobile scroll/render regression test ran unexpectedly slowly: ${elapsed}ms.`);
    console.log(`${BROWSER_NAME} mobile scroll/render race regression passed.`);
    console.log(JSON.stringify({browser:BROWSER_NAME,trace,health},null,2));
  }finally{await browser.close();}
})().catch(error=>{console.error(error.stack||error);process.exit(1);});

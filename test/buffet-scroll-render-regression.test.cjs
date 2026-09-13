const { chromium, webkit } = require('playwright');
const LIVE_URL = process.env.MEATFEST_LIVE_URL || 'https://fsdc-meatfest.michael-larick.workers.dev/';
const BROWSER_NAME = process.env.MEATFEST_BROWSER || 'chromium';
const VIEWPORT_HEIGHT = 844;
const fail = message => { throw new Error(message); };

(async()=>{
  const browser=await (BROWSER_NAME==='webkit'?webkit:chromium).launch({headless:true});
  const page=await browser.newPage({viewport:{width:390,height:VIEWPORT_HEIGHT},deviceScaleFactor:2,isMobile:true});
  await page.addInitScript(()=>{
    const NativeWorker=window.Worker;
    window.__meatfestWorkerPosts=0;
    window.Worker=class extends NativeWorker{postMessage(...args){window.__meatfestWorkerPosts++;return super.postMessage(...args)}};
  });
  try{
    const response=await page.goto(LIVE_URL,{waitUntil:'domcontentloaded',timeout:60000});
    if(!response||!response.ok())fail(`${BROWSER_NAME} Cloudflare page request failed: ${response?response.status():'no response'}`);
    await page.addStyleTag({content:'html{scroll-behavior:auto !important}'});
    await page.locator('meatfest-buffet #buffetServiceCard').waitFor({state:'attached',timeout:30000});
    await page.waitForFunction(()=>{const host=document.querySelector('meatfest-buffet');const root=host?.shadowRoot;const h=root?.querySelector('#buffetLayoutDynamic .table b');return !!h&&!/waiting for plan/.test(h.textContent||'')},{timeout:15000});
    const initialPosts=await page.evaluate(()=>window.__meatfestWorkerPosts);
    if(initialPosts<1)fail(`${BROWSER_NAME}: Buffet never performed its initial calculation.`);
    await page.evaluate(()=>window.__meatfestWorkerPosts=0);
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.waitForTimeout(150);
    const trace=[];
    for(let i=0;i<40;i++){
      await page.evaluate(()=>window.scrollBy(0,240));
      await page.waitForTimeout(25);
      trace.push(await page.evaluate(()=>({y:window.scrollY,h:document.documentElement.scrollHeight})));
    }
    const maxY=Math.max(...trace.map(x=>x.y));
    const minHeight=Math.min(...trace.map(x=>x.h)),maxHeight=Math.max(...trace.map(x=>x.h));
    const backwardJumps=[];
    for(let i=1;i<trace.length;i++)if(trace[i].y<trace[i-1].y-200)backwardJumps.push({from:trace[i-1].y,to:trace[i].y,at:i});
    const expectedMax=Math.max(0,maxHeight-VIEWPORT_HEIGHT);
    const postsDuringScroll=await page.evaluate(()=>window.__meatfestWorkerPosts);
    if(backwardJumps.length)fail(`${BROWSER_NAME}: scroll position jumped backward: ${JSON.stringify(backwardJumps)}`);
    if(maxY<expectedMax-300)fail(`${BROWSER_NAME}: scroll did not reach the expected range: maxY=${maxY} expectedMax=${expectedMax}`);
    if(maxHeight-minHeight>50)fail(`${BROWSER_NAME}: document height changed while scrolling: min=${minHeight} max=${maxHeight}`);
    if(postsDuringScroll!==0)fail(`${BROWSER_NAME}: Buffet performed calculation work during scrolling: workerPosts=${postsDuringScroll}`);
    const health=await page.evaluate(()=>{const root=document.querySelector('meatfest-buffet')?.shadowRoot;return{scrollY,scrollHeight:document.documentElement.scrollHeight,rows:root?.querySelectorAll('#buffetServiceCard .row').length||0,tables:root?.querySelectorAll('#buffetLayoutDynamic .table').length||0,controls:root?.querySelectorAll('#buffetServiceCard button[data-kind]').length||0}});
    if(health.rows!==15||health.tables!==8||health.controls<10)fail(`${BROWSER_NAME}: Buffet component lost structural integrity during scroll: ${JSON.stringify(health)}`);
    console.log(`${BROWSER_NAME} mobile Buffet scroll isolation regression passed.`);
    console.log(JSON.stringify({browser:BROWSER_NAME,initialPosts,postsDuringScroll,trace,health},null,2));
  }finally{await browser.close();}
})().catch(error=>{console.error(error.stack||error);process.exit(1);});

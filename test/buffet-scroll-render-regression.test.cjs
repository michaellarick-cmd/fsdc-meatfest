const { chromium, webkit } = require('playwright');
const LIVE_URL = process.env.MEATFEST_LIVE_URL || 'https://fsdc-meatfest.michael-larick.workers.dev/';
const BROWSER_NAME = process.env.MEATFEST_BROWSER || 'chromium';
const VIEWPORT_HEIGHT = 844;
const fail = message => { throw new Error(message); };
(async()=>{
  const browser=await (BROWSER_NAME==='webkit'?webkit:chromium).launch({headless:true});
  const page=await browser.newPage({viewport:{width:390,height:VIEWPORT_HEIGHT},deviceScaleFactor:2,isMobile:true});
  try{
    // Instrument Worker before navigation so the initial Buffet calculation is observable.
    await page.addInitScript(()=>{window.__meatfestWorkerPosts=0;const originalPostMessage=Worker.prototype.postMessage;Worker.prototype.postMessage=function(...args){window.__meatfestWorkerPosts++;return originalPostMessage.apply(this,args)}});
    const response=await page.goto(LIVE_URL,{waitUntil:'domcontentloaded',timeout:60000});
    if(!response||!response.ok())fail(`${BROWSER_NAME} Cloudflare page request failed: ${response?response.status():'no response'}`);
    await page.addStyleTag({content:'html{scroll-behavior:auto !important}'});
    await page.locator('meatfest-buffet #buffetServiceCard').waitFor({state:'attached',timeout:30000});
    await page.locator('meatfest-buffet #buffetLayoutCard').waitFor({state:'attached',timeout:30000});
    await page.locator('meatfest-buffet').scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>{const root=document.querySelector('meatfest-buffet')?.shadowRoot;const h=root?.querySelector('[data-mf-section="layout"] .table b');return !!h&&!/waiting for plan/.test(h.textContent||'')},{timeout:30000});
    const initialPosts=await page.evaluate(()=>window.__meatfestWorkerPosts);if(initialPosts<1)fail(`${BROWSER_NAME}: Buffet never performed its initial calculation.`);
    await page.evaluate(()=>window.__meatfestWorkerPosts=0);await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(150);
    const trace=[];
    for(let i=0;i<40;i++){await page.evaluate(()=>window.scrollBy(0,240));await page.waitForTimeout(25);trace.push(await page.evaluate(()=>({y:window.scrollY,h:document.documentElement.scrollHeight,posts:window.__meatfestWorkerPosts})))}
    const maxY=Math.max(...trace.map(x=>x.y)),minHeight=Math.min(...trace.map(x=>x.h)),maxHeight=Math.max(...trace.map(x=>x.h)),backwardJumps=[];
    for(let i=1;i<trace.length;i++)if(trace[i].y<trace[i-1].y-200)backwardJumps.push({from:trace[i-1].y,to:trace[i].y,at:i});
    const expectedMax=Math.max(0,maxHeight-VIEWPORT_HEIGHT),postsDuringScroll=await page.evaluate(()=>window.__meatfestWorkerPosts),postIndices=trace.map((x,i)=>x.posts?i:null).filter(i=>i!==null);
    if(backwardJumps.length)fail(`${BROWSER_NAME}: scroll position jumped backward: ${JSON.stringify(backwardJumps)}`);
    if(maxY<expectedMax-300)fail(`${BROWSER_NAME}: scroll did not reach the expected range: maxY=${maxY} expectedMax=${expectedMax}`);
    if(maxHeight-minHeight>50)fail(`${BROWSER_NAME}: document height changed while scrolling: min=${minHeight} max=${maxHeight}`);
    if(postsDuringScroll>1)fail(`${BROWSER_NAME}: Buffet performed repeated calculation work during scrolling: workerPosts=${postsDuringScroll} indices=${postIndices}`);
    const health=await page.evaluate(()=>{const root=document.querySelector('meatfest-buffet')?.shadowRoot;return{scrollY,scrollHeight:document.documentElement.scrollHeight,rows:root?.querySelectorAll('[data-mf-section="service"] .row').length||0,tables:root?.querySelectorAll('[data-mf-section="layout"] .table').length||0,controls:root?.querySelectorAll('#buffetServiceCard button[data-kind]').length||0}});
    if(health.rows!==15||health.tables!==8||health.controls<10)fail(`${BROWSER_NAME}: Buffet component lost structural integrity during scroll: ${JSON.stringify(health)}`);
    console.log(`${BROWSER_NAME} mobile Buffet scroll isolation regression passed.`);console.log(JSON.stringify({browser:BROWSER_NAME,initialPosts,postsDuringScroll,postIndices,trace,health},null,2));
  }finally{await browser.close()}
})().catch(error=>{console.error(error.stack||error);process.exit(1)});

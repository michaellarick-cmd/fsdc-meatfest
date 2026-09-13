const { chromium, webkit } = require('playwright');
const LIVE_URL = process.env.MEATFEST_LIVE_URL || 'https://fsdc-meatfest.michael-larick.workers.dev/';
const BROWSER_NAME = process.env.MEATFEST_BROWSER || 'chromium';
const fail = message => { throw new Error(message); };

(async()=>{
 const browser=await (BROWSER_NAME==='webkit'?webkit:chromium).launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true});
 await page.addInitScript(()=>{const NativeWorker=window.Worker;window.__meatfestWorkerPosts=0;window.Worker=class extends NativeWorker{postMessage(...args){window.__meatfestWorkerPosts++;return super.postMessage(...args)}}});
 try{
  const response=await page.goto(LIVE_URL,{waitUntil:'domcontentloaded',timeout:60000});
  if(!response||!response.ok())fail(`${BROWSER_NAME} Cloudflare page request failed: ${response?response.status():'no response'}`);
  await page.addStyleTag({content:'html{scroll-behavior:auto !important}'});
  await page.locator('meatfest-buffet #buffetServiceCard').waitFor({state:'attached',timeout:30000});
  await page.locator('meatfest-buffet #buffetLayoutCard').waitFor({state:'attached',timeout:30000});
  await page.waitForFunction(()=>{const host=document.querySelector('meatfest-buffet');const h=host?.shadowRoot?.querySelector('[data-mf-section="layout"] .table b');return !!h&&!/waiting for plan/.test(h.textContent||'')},{timeout:15000});
  await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight)); await page.waitForTimeout(300);
  const scrollTrace=[];
  for(let i=0;i<=40;i++){const maxScroll=await page.evaluate(()=>Math.max(0,document.documentElement.scrollHeight-window.innerHeight));await page.evaluate(target=>window.scrollTo(0,target),Math.round(maxScroll*(i/40)));await page.waitForTimeout(35);scrollTrace.push(await page.evaluate(()=>({y:window.scrollY,h:document.documentElement.scrollHeight})))}
  const minHeight=Math.min(...scrollTrace.map(x=>x.h)),maxHeight=Math.max(...scrollTrace.map(x=>x.h)),finalScroll=scrollTrace[scrollTrace.length-1].y,expectedMaxScroll=Math.max(0,maxHeight-844);
  if(finalScroll<Math.max(0,expectedMaxScroll-250))fail(`${BROWSER_NAME} continuous-scroll regression did not reach the page bottom: finalScroll=${finalScroll} expectedMaxScroll=${expectedMaxScroll} scrollHeight=${maxHeight}`);
  if(maxHeight-minHeight>50)fail(`${BROWSER_NAME} continuous-scroll regression changed document height while scrolling: min=${minHeight} max=${maxHeight}`);
  await page.waitForTimeout(500);
  const post=await page.evaluate(()=>{const root=document.querySelector('meatfest-buffet')?.shadowRoot;return{scrollY,scrollHeight:document.documentElement.scrollHeight,viewportHeight:innerHeight,rows:root?.querySelectorAll('[data-mf-section="service"] .row').length||0,tables:root?.querySelectorAll('[data-mf-section="layout"] .table').length||0,controls:root?.querySelectorAll('#buffetServiceCard button[data-kind]').length||0}});
  if(post.scrollY<Math.max(0,post.scrollHeight-post.viewportHeight-250))fail(`${BROWSER_NAME} scroll snapped away from bottom: ${JSON.stringify(post)}`);
  if(post.rows<15||post.tables!==8||post.controls<10)fail(`${BROWSER_NAME} Buffet DOM incomplete after scroll: ${JSON.stringify(post)}`);
  await page.locator('meatfest-buffet #buffetServiceCard').scrollIntoViewIfNeeded();
  const workerPostsBeforeDwell=await page.evaluate(()=>window.__meatfestWorkerPosts);await page.waitForTimeout(1800);const workerPostsAfterDwell=await page.evaluate(()=>window.__meatfestWorkerPosts);
  if(workerPostsAfterDwell-workerPostsBeforeDwell!==0)fail(`${BROWSER_NAME} Buffet recalculated without a state change while visible: workerPosts=${workerPostsAfterDwell-workerPostsBeforeDwell}`);
  const selections=[['supplemental','burgers','Burgers'],['supplemental','hotdogs','Hot Dogs'],['supplemental','brats','Grilling Brats'],['condiment','bbqSauce','BBQ Sauce'],['dessert','cobbler','Cobbler / Crisp'],['dessert','pudding','Pudding / Cream Dessert'],['dessert','pie','Pie'],['dessert','cake','Cake'],['dessert','cookies','Cookies / Bars']];
  const selected=[];const timings=[];
  for(const [kind,id,label] of selections){
   const button=page.locator(`meatfest-buffet button[data-kind="${kind}"][data-id="${id}"]`);if(await button.count()!==1)fail(`${BROWSER_NAME}: ${label} control is missing.`);if(await button.getAttribute('aria-pressed')!=='false')fail(`${BROWSER_NAME}: ${label} did not start unselected.`);
   await button.scrollIntoViewIfNeeded();const before=await button.evaluate(el=>({top:el.getBoundingClientRect().top,scrollY:scrollY}));const start=Date.now();await button.click();
   await page.waitForFunction(({kind,id})=>document.querySelector('meatfest-buffet')?.shadowRoot?.querySelector(`button[data-kind="${kind}"][data-id="${id}"]`)?.getAttribute('aria-pressed')==='true',{kind,id},{timeout:3000});
   const elapsed=Date.now()-start;if(elapsed>250)fail(`${BROWSER_NAME}: ${label} selection handler was not immediately responsive: ${elapsed}ms.`);selected.push([kind,id]);
   for(const [ek,ei] of selected)if(await page.locator(`meatfest-buffet button[data-kind="${ek}"][data-id="${ei}"]`).getAttribute('aria-pressed')!=='true')fail(`${BROWSER_NAME}: ${label} selection lost ${ei}.`);
   await page.waitForTimeout(300);const after=await button.evaluate(el=>({top:el.getBoundingClientRect().top,scrollY:scrollY}));const expectedTop=before.top-(after.scrollY-before.scrollY),topDelta=Math.abs(after.top-expectedTop);
   if(topDelta>100)fail(`${BROWSER_NAME}: ${label} moved unexpectedly: ${topDelta}px.`);
   const health=await page.evaluate(()=>{const root=document.querySelector('meatfest-buffet')?.shadowRoot;return{serviceHeight:root?.querySelector('#buffetServiceCard')?.getBoundingClientRect().height||0,layoutHeight:root?.querySelector('#buffetLayoutCard')?.getBoundingClientRect().height||0,scrollHeight:document.documentElement.scrollHeight,rows:root?.querySelectorAll('[data-mf-section="service"] .row').length||0,tables:root?.querySelectorAll('[data-mf-section="layout"] .table').length||0,controls:root?.querySelectorAll('#buffetServiceCard button[data-kind]').length||0}});
   if(health.serviceHeight<100||health.layoutHeight<100||health.scrollHeight<500||health.tables!==8||health.controls<10)fail(`${BROWSER_NAME}: ${label} left invalid layout: ${JSON.stringify(health)}`);timings.push({label,elapsed,topDelta});
  }
  const first=timings[0].elapsed,final=timings[timings.length-1].elapsed;if(final>Math.max(250,first*5))fail(`${BROWSER_NAME}: interaction time degraded excessively: first=${first}ms final=${final}ms.`);
  console.log(`${BROWSER_NAME} mobile Buffet component interaction and scroll regression passed.`);console.log(JSON.stringify({browser:BROWSER_NAME,url:LIVE_URL,selections:timings,continuousScroll:{minHeight,maxHeight,finalScroll,expectedMaxScroll}},null,2));
 }finally{await browser.close()}
})().catch(error=>{console.error(error.stack||error);process.exit(1)});

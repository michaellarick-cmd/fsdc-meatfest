const { chromium, webkit } = require('playwright');
const LIVE_URL = process.env.MEATFEST_LIVE_URL || 'https://fsdc-meatfest.michael-larick.workers.dev/';
const BROWSER_NAME = process.env.MEATFEST_BROWSER || 'chromium';
const fail = message => { throw new Error(message); };
(async()=>{
 const browser=await (BROWSER_NAME==='webkit'?webkit:chromium).launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true});
 try{
  const response=await page.goto(LIVE_URL,{waitUntil:'domcontentloaded',timeout:60000});
  if(!response||!response.ok())fail(`${BROWSER_NAME} Cloudflare page request failed: ${response?response.status():'no response'}`);
  await page.addStyleTag({content:'html{scroll-behavior:auto !important}'});
  await page.locator('#buffetServiceCard').waitFor({state:'attached',timeout:30000});
  await page.locator('#buffetLayoutCard').waitFor({state:'attached',timeout:30000});
  await page.waitForFunction(()=>document.querySelector('#buffetDynamic')&&document.querySelector('#buffetLayoutDynamic'),{timeout:30000});
  await page.waitForFunction(()=>{const h=document.querySelector('#buffetLayoutDynamic .b9table b');return !!h&&!/waiting for plan/.test(h.textContent||'')},{timeout:15000});
  await page.evaluate(()=>window.scrollTo(0,0));
  const scrollTrace=[];
  for(let i=0;i<=40;i++){
   const maxScroll=await page.evaluate(()=>Math.max(0,document.documentElement.scrollHeight-window.innerHeight));
   const target=Math.round(maxScroll*(i/40));
   await page.evaluate(target=>window.scrollTo(0,target),target);
   await page.waitForTimeout(35);
   scrollTrace.push(await page.evaluate(()=>({y:window.scrollY,h:document.documentElement.scrollHeight})));
  }
  const minHeight=Math.min(...scrollTrace.map(x=>x.h)),maxHeight=Math.max(...scrollTrace.map(x=>x.h));
  const finalScroll=scrollTrace[scrollTrace.length-1].y;
  const expectedMaxScroll=Math.max(0,maxHeight-844);
  if(finalScroll<Math.max(0,expectedMaxScroll-250))fail(`${BROWSER_NAME} continuous-scroll regression did not reach the page bottom: finalScroll=${finalScroll} expectedMaxScroll=${expectedMaxScroll} scrollHeight=${maxHeight}`);
  if(maxHeight-minHeight>250)fail(`${BROWSER_NAME} continuous-scroll regression changed document height while scrolling: min=${minHeight} max=${maxHeight}`);
  await page.waitForTimeout(500);
  const post=await page.evaluate(()=>({scrollY:scrollY,scrollHeight:document.documentElement.scrollHeight,viewportHeight:innerHeight,rows:document.querySelectorAll('#buffetDynamic .b9row').length,tables:document.querySelectorAll('#buffetLayoutDynamic .b9table').length,controls:document.querySelectorAll('#buffetServiceCard button[data-k]').length}));
  if(post.scrollY<Math.max(0,post.scrollHeight-post.viewportHeight-250))fail(`${BROWSER_NAME} scroll snapped away from bottom: ${JSON.stringify(post)}`);
  if(post.rows<15||post.tables!==8||post.controls<10)fail(`${BROWSER_NAME} Buffet DOM incomplete after scroll: ${JSON.stringify(post)}`);
  const selections=[['supplemental','burgers','Burgers'],['supplemental','hotdogs','Hot Dogs'],['supplemental','brats','Grilling Brats'],['condiment','bbqSauce','BBQ Sauce'],['dessert','cobbler','Cobbler / Crisp'],['dessert','pudding','Pudding / Cream Dessert'],['dessert','pie','Pie'],['dessert','cake','Cake'],['dessert','cookies','Cookies / Bars']];
  const selected=[]; const timings=[];
  for(const [key,id,label] of selections){
   const button=page.locator(`button[data-k="${key}"][data-id="${id}"]`);
   if(await button.count()!==1)fail(`${BROWSER_NAME}: ${label} control is missing.`);
   if(await button.getAttribute('aria-pressed')!=='false')fail(`${BROWSER_NAME}: ${label} did not start unselected.`);
   await button.evaluate(el=>el.scrollIntoView({block:'center',inline:'nearest'})); await page.waitForTimeout(50);
   const before=await button.evaluate(el=>({top:el.getBoundingClientRect().top,scrollY:scrollY}));
   const start=Date.now(); await button.evaluate(el=>el.click());
   await page.waitForFunction(({key,id})=>document.querySelector(`button[data-k="${key}"][data-id="${id}"]`)?.getAttribute('aria-pressed')==='true',{key,id},{timeout:3000});
   const elapsed=Date.now()-start; if(elapsed>250)fail(`${BROWSER_NAME}: ${label} selection handler was not immediately responsive: ${elapsed}ms.`);
   selected.push([key,id]);
   for(const [ek,ei] of selected){if(await page.locator(`button[data-k="${ek}"][data-id="${ei}"]`).getAttribute('aria-pressed')!=='true')fail(`${BROWSER_NAME}: ${label} selection lost ${ei}.`);}
   await page.waitForFunction(()=>document.querySelectorAll('#buffetLayoutDynamic .b9table').length>0&&document.querySelectorAll('#buffetDynamic .b9row').length>0,{timeout:15000});
   await page.waitForTimeout(300);
   const after=await button.evaluate(el=>({top:el.getBoundingClientRect().top,scrollY:scrollY}));
   const expectedTop=before.top-(after.scrollY-before.scrollY); const topDelta=Math.abs(after.top-expectedTop);
   if(topDelta>100)fail(`${BROWSER_NAME}: ${label} moved unexpectedly: ${topDelta}px.`);
   const health=await page.evaluate(()=>({serviceHeight:document.getElementById('buffetServiceCard')?.getBoundingClientRect().height||0,layoutHeight:document.getElementById('buffetLayoutCard')?.getBoundingClientRect().height||0,scrollHeight:document.documentElement.scrollHeight,rows:document.querySelectorAll('#buffetDynamic .b9row').length,tables:document.querySelectorAll('#buffetLayoutDynamic .b9table').length,controls:document.querySelectorAll('#buffetServiceCard button[data-k]').length}));
   if(health.serviceHeight<100||health.layoutHeight<100||health.scrollHeight<500||health.tables<1||health.tables>8||health.controls<10)fail(`${BROWSER_NAME}: ${label} left invalid layout: ${JSON.stringify(health)}`);
   timings.push({label,elapsed,topDelta});
  }
  const first=timings[0].elapsed,final=timings[timings.length-1].elapsed;
  if(final>Math.max(250,first*5))fail(`${BROWSER_NAME}: interaction time degraded excessively: first=${first}ms final=${final}ms.`);
  console.log(`${BROWSER_NAME} mobile buffet selection and scroll regression passed.`);
  console.log(JSON.stringify({browser:BROWSER_NAME,url:LIVE_URL,selections:timings,continuousScroll:{minHeight,maxHeight,finalScroll,expectedMaxScroll}},null,2));
 }finally{await browser.close();}
})().catch(error=>{console.error(error.stack||error);process.exit(1);});

const { chromium, webkit } = require('playwright');
const LIVE_URL = process.env.MEATFEST_LIVE_URL || 'https://fsdc-meatfest.michael-larick.workers.dev/';
const BROWSER_NAME = process.env.MEATFEST_BROWSER || 'chromium';
const VIEWPORT_HEIGHT = 844;
const fail = message => { throw new Error(message); };

async function runMobile(browser) {
  const page=await browser.newPage({viewport:{width:390,height:VIEWPORT_HEIGHT},deviceScaleFactor:2,isMobile:true});
  try{
    await page.addInitScript(()=>{localStorage.clear();sessionStorage.clear();window.__meatfestWorkerPosts=0;const originalPostMessage=Worker.prototype.postMessage;Worker.prototype.postMessage=function(...args){window.__meatfestWorkerPosts++;return originalPostMessage.apply(this,args)}});
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
  }finally{await page.close()}
}

async function runDesktop(browser) {
  const page=await browser.newPage({viewport:{width:1280,height:900},deviceScaleFactor:1,isMobile:false});
  const events=[];
  page.on('pageerror',error=>events.push(`pageerror: ${error.message}`));
  page.on('console',msg=>{if(msg.type()==='error')events.push(`console: ${msg.text()}`)});
  try{
    await page.addInitScript(()=>{
      localStorage.clear();
      sessionStorage.clear();
      window.__mfTrace={posts:0,connects:0,disconnects:0};
      const originalPostMessage=Worker.prototype.postMessage;
      Worker.prototype.postMessage=function(...args){window.__mfTrace.posts++;return originalPostMessage.apply(this,args)};
      const observe=()=>{const el=document.querySelector('meatfest-buffet');if(!el||el.__mfObserved)return;el.__mfObserved=true;const proto=Object.getPrototypeOf(el);const originalConnected=proto.connectedCallback,originalDisconnected=proto.disconnectedCallback;el.connectedCallback=function(){window.__mfTrace.connects++;return originalConnected?.call(this)};el.disconnectedCallback=function(){window.__mfTrace.disconnects++;return originalDisconnected?.call(this)}};
      new MutationObserver(observe).observe(document.documentElement,{subtree:true,childList:true});
    });
    const response=await page.goto(LIVE_URL,{waitUntil:'domcontentloaded',timeout:60000});
    if(!response||!response.ok())fail(`desktop Cloudflare page request failed: ${response?response.status():'no response'}`);
    await page.addStyleTag({content:'html{scroll-behavior:auto !important}'});
    await page.locator('meatfest-buffet #buffetServiceCard').waitFor({state:'attached',timeout:30000});
    await page.locator('meatfest-buffet #buffetLayoutCard').waitFor({state:'attached',timeout:30000});
    await page.waitForFunction(()=>{const root=document.querySelector('meatfest-buffet')?.shadowRoot;const h=root?.querySelector('[data-mf-section="layout"] .table b');return !!h&&!/waiting for plan/.test(h.textContent||'')},{timeout:30000});
    const initial=await page.evaluate(()=>{const el=document.querySelector('meatfest-buffet');const root=el.shadowRoot;return{y:scrollY,h:document.documentElement.scrollHeight,version:window.MeatfestBuffet?.version,app:performance.getEntriesByType('resource').filter(x=>x.name.includes('buffet-app.js')||x.name.includes('buffet-ui.js')).map(x=>x.name),host:el.isConnected,pressed:[...root.querySelectorAll('button[data-kind]')].filter(b=>b.dataset.kind!=='sausage'&&b.getAttribute('aria-pressed')==='true').map(b=>b.textContent.trim()),buttons:[...root.querySelectorAll('button[data-kind]')].map(b=>({kind:b.dataset.kind,id:b.dataset.id||b.getAttribute('data-id'),label:b.textContent.trim(),pressed:b.getAttribute('aria-pressed')})),trace:window.__mfTrace}});
    if(initial.version!==5)fail(`desktop: wrong Buffet version ${initial.version}`);
    if(!initial.app.some(x=>x.includes('buffet-app.js?v=5')))fail(`desktop: buffet-app.js?v=5 was not loaded: ${JSON.stringify(initial.app)}`);
    if(initial.pressed.length)fail(`desktop: clean profile still has persisted Buffet selections: ${JSON.stringify(initial.pressed)}`);
    const button=(kind,label)=>page.locator(`meatfest-buffet button[data-kind="${kind}"]`).filter({hasText:label}).first();
    const state=()=>page.evaluate(()=>{const host=document.querySelector('meatfest-buffet');const root=host?.shadowRoot;return{y:scrollY,h:document.documentElement.scrollHeight,hostConnected:!!host?.isConnected,pressed:[...root.querySelectorAll('button[data-kind]')].filter(b=>b.getAttribute('aria-pressed')==='true').map(b=>b.textContent.trim()),rows:root?.querySelectorAll('[data-mf-section="service"] .row').length||0,tables:root?.querySelectorAll('[data-mf-section="layout"] .table').length||0,trace:{...window.__mfTrace}}});
    await page.evaluate(()=>window.scrollTo(0,Math.max(0,document.documentElement.scrollHeight*.35)));await page.waitForTimeout(100);
    const beforeSelect=await state();
    await button('supplemental','Burgers').click();
    await button('supplemental','Grilling Brats').click();
    const afterProteins=await state();
    if(!afterProteins.pressed.includes('Burgers')||!afterProteins.pressed.includes('Grilling Brats'))fail(`desktop: protein selections did not persist: ${JSON.stringify(afterProteins)}`);
    await page.mouse.wheel(0,900);await page.waitForTimeout(150);
    const beforeCondiment=await state();
    await button('condiment','BBQ Sauce').click();
    const afterCondiment=await state();
    if(!afterCondiment.pressed.includes('Burgers')||!afterCondiment.pressed.includes('Grilling Brats')||!afterCondiment.pressed.includes('BBQ Sauce'))fail(`desktop: condiment selection reset earlier choices: ${JSON.stringify({beforeCondiment,afterCondiment})}`);
    await page.mouse.wheel(0,1400);await page.waitForTimeout(150);
    await button('dessert','Cobbler / Crisp').click();
    const afterDessert=await state();
    if(!afterDessert.pressed.includes('Burgers')||!afterDessert.pressed.includes('Grilling Brats')||!afterDessert.pressed.includes('BBQ Sauce')||!afterDessert.pressed.includes('Cobbler / Crisp'))fail(`desktop: dessert selection reset earlier choices: ${JSON.stringify({beforeCondiment,afterDessert})}`);
    const yAfterDessert=afterDessert.y;
    await page.mouse.wheel(0,-1200);await page.waitForTimeout(100);await page.mouse.wheel(0,700);await page.waitForTimeout(100);
    const final=await state();
    if(final.y===yAfterDessert)fail('desktop: scroll did not move after interaction');
    if(final.h!==afterDessert.h)fail(`desktop: document height changed after selection/scroll: before=${afterDessert.h} after=${final.h}`);
    if(final.rows!==15||final.tables!==8)fail(`desktop: structure changed: ${JSON.stringify(final)}`);
    if(!final.pressed.includes('Burgers')||!final.pressed.includes('Grilling Brats')||!final.pressed.includes('BBQ Sauce')||!final.pressed.includes('Cobbler / Crisp'))fail(`desktop: selections were lost after scroll-away/back: ${JSON.stringify(final)}`);
    if(final.trace.connects!==initial.trace.connects||final.trace.disconnects!==initial.trace.disconnects)fail(`desktop: Buffet custom element lifecycle changed during interaction: initial=${JSON.stringify(initial.trace)} final=${JSON.stringify(final.trace)}`);
    if(events.length)fail(`desktop: browser errors observed: ${JSON.stringify(events)}`);
    console.log('desktop Buffet exact interaction regression passed.');console.log(JSON.stringify({initial,beforeSelect,afterProteins,beforeCondiment,afterCondiment,afterDessert,final,events},null,2));
  }finally{await page.close()}
}

(async()=>{
  const browser=await (BROWSER_NAME==='webkit'?webkit:chromium).launch({headless:true});
  try{await runMobile(browser);await runDesktop(browser)}finally{await browser.close()}
})().catch(error=>{console.error(error.stack||error);process.exit(1)});

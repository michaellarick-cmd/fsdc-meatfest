const { chromium, webkit } = require('playwright');
const LIVE_URL = process.env.MEATFEST_LIVE_URL || 'https://fsdc-meatfest.michael-larick.workers.dev/';
const BROWSER_NAME = process.env.MEATFEST_BROWSER || 'chromium';
const fail = message => { throw new Error(message); };

(async () => {
  const browserType = BROWSER_NAME === 'webkit' ? webkit : chromium;
  const browser = await browserType.launch({headless:true});
  const page = await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true});
  try {
    const response = await page.goto(LIVE_URL,{waitUntil:'domcontentloaded',timeout:60000});
    if(!response || !response.ok()) fail(`${BROWSER_NAME} Cloudflare page request failed: ${response ? response.status() : 'no response'}`);
    await page.addStyleTag({content:'html{scroll-behavior:auto !important}'});
    await page.locator('#buffetServiceCard').waitFor({state:'attached',timeout:30000});
    await page.locator('#buffetLayoutCard').waitFor({state:'attached',timeout:30000});
    await page.waitForFunction(()=>document.querySelector('#buffetDynamic') && document.querySelector('#buffetLayoutDynamic'),{timeout:30000});
    // The initial Worker plan is requested during initialization, before the Buffet
    // enters the viewport. Do not begin the geometry regression until that plan has
    // rendered, otherwise the test would manufacture the very race we are guarding against.
    await page.waitForFunction(()=>{
      const h=document.querySelector('#buffetLayoutDynamic .b9table b');
      return !!h && !/waiting for plan/.test(h.textContent||'');
    },{timeout:15000});

    // Critical regression: the initial Worker calculation must not mutate document geometry
    // while a mobile WebKit user is continuously scrolling through the page.
    await page.evaluate(()=>window.scrollTo(0,0));
    const scrollTrace=[];
    for(let y=0;y<=1;y+=0.025){
      const max=await page.evaluate(()=>Math.max(0,document.documentElement.scrollHeight-window.innerHeight));
      const target=Math.round(max*y);
      await page.evaluate(target=>window.scrollTo(0,target),target);
      await page.waitForTimeout(35);
      scrollTrace.push(await page.evaluate(()=>({y:window.scrollY,h:document.documentElement.scrollHeight,ready:document.readyState})));
    }
    const minHeight=Math.min(...scrollTrace.map(x=>x.h)),maxHeight=Math.max(...scrollTrace.map(x=>x.h));
    const finalScroll=scrollTrace[scrollTrace.length-1].y;
    if(finalScroll<Math.max(0,maxHeight-250)) fail(`${BROWSER_NAME} continuous-scroll regression did not reach the page bottom: finalScroll=${finalScroll} max=${maxHeight}`);
    if(maxHeight-minHeight>250) fail(`${BROWSER_NAME} continuous-scroll regression changed document height while scrolling: min=${minHeight} max=${maxHeight}`);
    await page.waitForTimeout(500);
    const postScroll=await page.evaluate(()=>({scrollY:window.scrollY,scrollHeight:document.documentElement.scrollHeight,serviceRows:document.querySelectorAll('#buffetDynamic .b9row').length,layoutTables:document.querySelectorAll('#buffetLayoutDynamic .b9table').length,controls:document.querySelectorAll('#buffetServiceCard button[data-k]').length}));
    if(postScroll.scrollY<Math.max(0,postScroll.scrollHeight-window.innerHeight-250)) fail(`${BROWSER_NAME} continuous-scroll regression snapped away from the bottom after scroll settled: ${JSON.stringify(postScroll)}`);
    if(postScroll.serviceRows<15||postScroll.layoutTables!==8) fail(`${BROWSER_NAME} continuous-scroll regression left Buffet DOM incomplete: ${JSON.stringify(postScroll)}`);

    const initialScroll=await page.evaluate(()=>{
      window.scrollTo(0,Math.max(0,document.documentElement.scrollHeight-window.innerHeight-200));
      return window.scrollY;
    });
    await page.waitForTimeout(500);
    const initialScrollAfter=await page.evaluate(()=>window.scrollY);
    if(Math.abs(initialScrollAfter-initialScroll)>1000) fail(`${BROWSER_NAME} initial buffet page shifted catastrophically while scrolling: before=${initialScroll} after=${initialScrollAfter}`);

    const selections=[
      ['supplemental','burgers','Burgers'],
      ['supplemental','hotdogs','Hot Dogs'],
      ['supplemental','brats','Grilling Brats'],
      ['condiment','bbqSauce','BBQ Sauce'],
      ['dessert','cobbler','Cobbler / Crisp'],
      ['dessert','pudding','Pudding / Cream Dessert'],
      ['dessert','pie','Pie'],
      ['dessert','cake','Cake'],
      ['dessert','cookies','Cookies / Bars']
    ];
    const timings=[];
    const selected=[];

    for(const [key,id,label] of selections){
      const button=page.locator(`button[data-k="${key}"][data-id="${id}"]`);
      if(await button.count()!==1) fail(`${BROWSER_NAME}: ${label} buffet control is missing.`);
      if(await button.getAttribute('aria-pressed')!=='false') fail(`${BROWSER_NAME}: ${label} control did not start unselected.`);

      await button.evaluate(el=>el.scrollIntoView({block:'center',inline:'nearest'}));
      await page.waitForTimeout(50);
      const before=await button.evaluate(el=>({top:el.getBoundingClientRect().top,scrollY:window.scrollY}));
      const start=Date.now();
      await button.evaluate(el=>el.click());
      await page.waitForFunction(({key,id})=>document.querySelector(`button[data-k="${key}"][data-id="${id}"]`)?.getAttribute('aria-pressed')==='true',{key,id},{timeout:3000});
      const elapsed=Date.now()-start;
      if(elapsed>250) fail(`${BROWSER_NAME}: ${label} selection handler was not immediately responsive: ${elapsed}ms.`);

      selected.push([key,id]);
      for(const [expectedKey,expectedId] of selected){
        const b=page.locator(`button[data-k="${expectedKey}"][data-id="${expectedId}"]`);
        if(await b.getAttribute('aria-pressed')!=='true') fail(`${BROWSER_NAME}: ${label} selection lost ${expectedId}.`);
      }

      await page.waitForFunction(()=>document.querySelectorAll('#buffetLayoutDynamic .b9table').length>0 && document.querySelectorAll('#buffetDynamic .b9row').length>0,{timeout:15000});
      await page.waitForTimeout(300);
      const after=await button.evaluate(el=>({top:el.getBoundingClientRect().top,scrollY:window.scrollY}));
      const expectedTop=before.top-(after.scrollY-before.scrollY);
      const topDelta=Math.abs(after.top-expectedTop);
      if(topDelta>100) fail(`${BROWSER_NAME}: ${label} selection changed the touched control's position beyond the intentional user scroll: beforeTop=${before.top.toFixed(1)} afterTop=${after.top.toFixed(1)} beforeScroll=${before.scrollY} afterScroll=${after.scrollY}`);

      const health=await page.evaluate(()=>({
        serviceHeight:document.getElementById('buffetServiceCard')?.getBoundingClientRect().height||0,
        layoutHeight:document.getElementById('buffetLayoutCard')?.getBoundingClientRect().height||0,
        scrollHeight:document.documentElement.scrollHeight,
        dynamicRows:document.querySelectorAll('#buffetDynamic .b9row').length,
        layoutTables:document.querySelectorAll('#buffetLayoutDynamic .b9table').length,
        controls:document.querySelectorAll('#buffetServiceCard button[data-k]').length
      }));
      if(health.serviceHeight<100||health.layoutHeight<100||health.scrollHeight<500) fail(`${BROWSER_NAME}: ${label} selection left an invalid page layout: ${JSON.stringify(health)}`);
      if(health.layoutTables<1||health.layoutTables>8) fail(`${BROWSER_NAME}: ${label} selection produced an invalid main buffet table count: ${JSON.stringify(health)}`);
      if(health.controls<10) fail(`${BROWSER_NAME}: ${label} selection lost buffet controls: ${JSON.stringify(health)}`);
      timings.push({label,elapsed,topDelta,selectedCount:selected.length,health});
    }

    const final=timings[timings.length-1].elapsed,first=timings[0].elapsed;
    if(final>Math.max(250,first*5)) fail(`${BROWSER_NAME}: buffet interaction time degraded excessively: first=${first}ms final=${final}ms.`);
    console.log(`${BROWSER_NAME} mobile buffet selection and scroll regression passed.`);
    console.log(JSON.stringify({browser:BROWSER_NAME,url:LIVE_URL,selections:timings,continuousScroll:{minHeight,maxHeight,finalScroll}},null,2));
  } finally { await browser.close(); }
})().catch(error=>{console.error(error.stack||error);process.exit(1);});

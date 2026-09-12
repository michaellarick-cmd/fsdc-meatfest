const { chromium } = require('playwright');
const LIVE_URL = process.env.MEATFEST_LIVE_URL || 'https://fsdc-meatfest.michael-larick.workers.dev/';
const fail = message => { throw new Error(message); };
const log = message => console.log(`[LIVE-VERIFY] ${message}`);

(async () => {
  let browser;
  try {
    log('starting Chromium');
    browser = await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],timeout:30000});
    const page = await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true});
    log(`navigating to ${LIVE_URL}`);
    const response = await page.goto(LIVE_URL,{waitUntil:'domcontentloaded',timeout:30000});
    if(!response || !response.ok()) fail(`Cloudflare page request failed: ${response ? response.status() : 'no response'}`);
    if(!(await page.title()).includes('Meatfest')) fail(`Unexpected page title: ${await page.title()}`);
    await page.locator('#buffetServiceCard').waitFor({state:'attached',timeout:15000});
    await page.waitForTimeout(500);

    const initialBread=await page.evaluate(()=>({
      rolls:document.querySelector('button[data-buffet-key="breadIds"][data-buffet-id="hawaiian"]')?.getAttribute('aria-pressed'),
      cornbread:document.querySelector('button[data-buffet-key="breadIds"][data-buffet-id="cornbread"]')?.getAttribute('aria-pressed')
    }));
    if(initialBread.rolls!=='false'||initialBread.cornbread!=='false') fail(`Bread controls did not start in a known state: ${JSON.stringify(initialBread)}`);

    const hotDogs=page.locator('button[data-buffet-key="supplementalIds"][data-buffet-id="hotdogs"]');
    if(await hotDogs.count()!==1) fail('Hot Dogs buffet control is missing.');
    await hotDogs.click();
    await page.waitForFunction(()=>document.querySelector('button[data-buffet-key="supplementalIds"][data-buffet-id="hotdogs"]')?.getAttribute('aria-pressed')==='true');
    await hotDogs.click();
    await page.waitForFunction(()=>document.querySelector('button[data-buffet-key="supplementalIds"][data-buffet-id="hotdogs"]')?.getAttribute('aria-pressed')==='false');

    await page.locator('#adults').fill('40');
    await page.locator('#adults').dispatchEvent('input');
    await page.locator('#kids').fill('8');
    await page.locator('#kids').dispatchEvent('input');
    await page.locator('#eventName').fill('Labor Day Meatfest 7.0');
    for(const key of ['brisket','pmbe','ribs','pork','brats','chicken']){
      const control=page.locator(`.meat[data-k="${key}"]`);
      if(await control.count()!==1) fail(`Protein control is missing: ${key}`);
      if(!(await control.evaluate(el=>el.classList.contains('on')))) await control.click();
    }
    for(const id of ['beans','mac','cauli','collards','rolls','cornbread']){
      const control=page.locator(`.sideCard[data-side="${id}"]`);
      if(await control.count()!==1) fail(`Side control is missing: ${id}`);
      if(!(await control.evaluate(el=>el.classList.contains('on')))) await control.click();
    }

    await page.waitForFunction(()=>{
      const service=document.querySelector('#buffetDynamic');
      const layout=document.querySelector('#buffetLayoutDynamic');
      const text=`${service?.innerText||''}\n${layout?.innerText||''}`;
      return ['Baked Beans','Cauliflower Mac','Mac & Cheese','Collard Greens','Hawaiian Rolls','Cornbread'].every(label=>text.includes(label)) &&
        text.includes('TABLE-BY-TABLE SETUP') && text.includes('Table 1');
    },undefined,{timeout:15000});

    const breadState=await page.evaluate(()=>({
      rolls:document.querySelector('button[data-buffet-key="breadIds"][data-buffet-id="hawaiian"]')?.getAttribute('aria-pressed'),
      cornbread:document.querySelector('button[data-buffet-key="breadIds"][data-buffet-id="cornbread"]')?.getAttribute('aria-pressed'),
      rollsDisabled:document.querySelector('button[data-buffet-key="breadIds"][data-buffet-id="hawaiian"]')?.disabled,
      cornbreadDisabled:document.querySelector('button[data-buffet-key="breadIds"][data-buffet-id="cornbread"]')?.disabled
    }));
    if(breadState.rolls!=='true'||breadState.cornbread!=='true'||!breadState.rollsDisabled||!breadState.cornbreadDisabled) fail(`Bread controls did not mirror the Accompaniment selections: ${JSON.stringify(breadState)}`);

    await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
    const scrollBefore=await page.evaluate(()=>window.scrollY);
    if(scrollBefore<200) fail(`Mobile regression did not reach the buffet bottom: ${scrollBefore}`);
    const burgers=page.locator('button[data-buffet-key="supplementalIds"][data-buffet-id="burgers"]');
    await burgers.click();
    await page.waitForTimeout(500);
    const scrollAfter=await page.evaluate(()=>window.scrollY);
    if(scrollAfter<scrollBefore-100) fail(`Buffet update reset mobile scroll position: before=${scrollBefore} after=${scrollAfter}`);

    const state=await page.evaluate(()=>{
      const summary=window.buildSummary();
      const B=window.BuffetEngine;
      const rows=summary.sideRows||[];
      const plan=B.sidePlan({sideIds:rows.map(r=>r.id),proteinKeys:summary.rows.map(r=>r.key),sideRows:rows});
      const serviceRows=[...document.querySelectorAll('#buffetDynamic .buffetPanel .buffetRow')].map(row=>({text:row.innerText,buy:row.querySelector('b')?.textContent?.trim()||''}));
      const shopping=Object.fromEntries(rows.map(r=>[r.id,sideBuyText(r.id,r.q.amount)]));
      const cauli=rows.find(r=>r.id==='cauli'||r.id==='cauliflowerMac');
      const collards=rows.find(r=>r.id==='collards');
      const cp=plan.find(r=>r.id==='collards');
      const serviceText=document.querySelector('#buffetServiceCard')?.innerText||'';
      const dynamicText=document.querySelector('#buffetDynamic')?.innerText||'';
      const layoutText=document.querySelector('#buffetLayoutDynamic')?.innerText||'';
      const legacy=document.querySelectorAll('#buffetLayoutCard .mf-visual,#buffetLayoutCard .mf-execution,#buffetLayoutCard .mf-physical,#buffetLayoutCard .mf-flow,#buffetLayoutCard .mf-recommended').length;
      const table=B.tableRequirement([{linearIn:102}],{tableLengths:[72,48]});
      const capacity=window.BuffetAllocation.allocate([{station:'core',linearIn:50,items:[{id:'protein-a',name:'Protein A',vessel:{type:'chafer'}}]},{station:'core',linearIn:50,items:[{id:'protein-b',name:'Protein B',vessel:{type:'chafer'}}]},{station:'specialty',linearIn:40,items:[{id:'specialty-a',name:'Specialty A',vessel:{type:'chafer'}}]}],[72,48]);
      return {summary,shopping,serviceRows,cauli,collards,cp,table,capacity,serviceText,dynamicText,layoutText,legacy};
    });

    if(state.summary.eaters!==44) fail(`Live adult-equivalent eater count is wrong: ${state.summary.eaters}`);
    if(state.summary.rows.length!==6) fail(`Live canonical protein selection did not produce six proteins.`);
    if(Math.abs(state.summary.total-86.125)>0.0001) fail(`Live canonical purchase weight is wrong: ${state.summary.total}`);
    if(!state.cauli||state.cauli.q.amount!==0.5||state.cauli.q.unit!=='tin') fail(`Live Cauliflower Mac quantity is wrong: ${JSON.stringify(state.cauli)}`);
    if(!state.collards||state.collards.q.amount!==1||state.collards.q.unit!=='recipe') fail(`Live Collard Greens quantity is wrong: ${JSON.stringify(state.collards)}`);
    if(!state.cp?.quantity?.service||state.cp.quantity.service.count!==1||state.cp.quantity.service.label!=='serving bowl') fail(`Live Collard Greens service calculation is wrong: ${JSON.stringify(state.cp?.quantity?.service)}`);
    if(state.cp.vessel?.type!=='bowl'||state.cp.service?.method!=='tongs') fail(`Live Collard Greens service metadata is wrong: ${JSON.stringify({vessel:state.cp.vessel,service:state.cp.service})}`);
    const sideNames={beans:'Baked Beans',cauli:'Cauliflower Mac',mac:'Mac & Cheese',collards:'Collard Greens'};
    for(const id of Object.keys(sideNames)){
      const row=state.summary.sideRows.find(r=>r.id===id);
      const expected=row?.q?.amount;
      const unit=row?.q?.unit;
      const actual=state.serviceRows.find(x=>x.text.startsWith(sideNames[id]))?.buy||'';
      if(expected==null||!actual) fail(`Missing shopping/service quantity for ${id}: shopping=${expected} service=${actual}`);
      if(unit==='tin'){
        const whole=Math.floor(expected+1e-9),remainder=Math.round((expected-whole)*4)/4;
        if(whole>0&&!actual.includes(`${whole} full tin`)) fail(`Service tin quantity lost whole-tin amount for ${id}: shopping=${expected} service=${actual}`);
        if(remainder===.25&&!actual.includes('filled ¼ full')) fail(`Service tin quantity lost quarter-tin amount for ${id}: shopping=${expected} service=${actual}`);
        if(remainder===.5&&!actual.includes('filled ½ full')) fail(`Service tin quantity lost half-tin amount for ${id}: shopping=${expected} service=${actual}`);
        if(remainder===.75&&!actual.includes('filled ¾ full')) fail(`Service tin quantity lost three-quarter-tin amount for ${id}: shopping=${expected} service=${actual}`);
      }else if(!actual.startsWith(String(expected))) fail(`Service quantity diverges from shopping quantity for ${id}: shopping=${expected} ${unit} service=${actual}`);
    }
    if(state.table.linearRequired!==102||state.table.linearProvided!==120||JSON.stringify(state.table.tables)!==JSON.stringify([72,48])) fail(`Live table requirement calculation is wrong: ${JSON.stringify(state.table)}`);
    if(state.legacy!==0) fail(`Legacy buffet presentation nodes are still rendering: ${state.legacy}`);
    for(const label of ['Baked Beans','Cauliflower Mac','Mac & Cheese','Collard Greens','Hawaiian Rolls','Cornbread']) if(!state.dynamicText.includes(label)&&!state.layoutText.includes(label)) fail(`Live buffet presentation is missing selected item: ${label}`);
    for(const label of ['Hawaiian Rolls','Cornbread']) if(!state.serviceText.includes(label)) fail(`Live buffet service card is missing bread control: ${label}`);
    if(!state.layoutText.includes('Hawaiian Rolls')) fail(`Live layout is missing Hawaiian Rolls.`);
    if(state.capacity.linearRequired!==140||state.capacity.linearProvided!==120||!state.capacity.overflow||state.capacity.overflowIn!==20) fail(`Live buffet overflow capacity calculation is wrong: ${JSON.stringify(state.capacity)}`);
    if(JSON.stringify(state.capacity.recommendedTables)!==JSON.stringify([72,72,48])) fail(`Live buffet overflow recommendation is wrong: ${JSON.stringify(state.capacity.recommendedTables)}`);
    if(!state.capacity.recommendedLayout||state.capacity.recommendedLayout.linearProvided!==192||state.capacity.recommendedLayout.linearRequired!==140||state.capacity.recommendedLayout.overflow) fail(`Live recommended expanded buffet layout is not a valid full-menu fit: ${JSON.stringify(state.capacity.recommendedLayout)}`);

    await page.evaluate(()=>{ window.__meatfestPrintCalled=false; window.print=()=>{window.__meatfestPrintCalled=true}; });
    const beforePrint=await page.evaluate(()=>({summary:window.buildSummary(),url:location.href,selected:[...selected],sides:[...selectedSides],supplemental:window.__meatfestBuffetState?.supplementalIds?.slice()}));
    await page.locator('#print').click();
    await page.waitForFunction(()=>window.__meatfestPrintCalled===true,{timeout:3000});
    await page.waitForFunction(()=>document.querySelector('#printSheet')?.textContent?.includes('TOTAL PURCHASE WEIGHT'),{timeout:3000});
    const afterPrint=await page.evaluate(()=>({summary:window.buildSummary(),url:location.href,selected:[...selected],sides:[...selectedSides],supplemental:window.__meatfestBuffetState?.supplementalIds?.slice(),title:document.querySelector('#psTitle')?.textContent}));
    if(JSON.stringify(afterPrint.summary)!==JSON.stringify(beforePrint.summary)) fail(`Print changed calculator summary/state: before=${JSON.stringify(beforePrint.summary)} after=${JSON.stringify(afterPrint.summary)}`);
    if(JSON.stringify(afterPrint.selected)!==JSON.stringify(beforePrint.selected)||JSON.stringify(afterPrint.sides)!==JSON.stringify(beforePrint.sides)||JSON.stringify(afterPrint.supplemental)!==JSON.stringify(beforePrint.supplemental)) fail(`Print changed selection state.`);
    if(afterPrint.url!==beforePrint.url) fail(`Print changed the page URL.`);
    if(afterPrint.title!=='LABOR DAY MEATFEST 7.0') fail(`Print sheet title was not populated from event state: ${afterPrint.title}`);

    log('live verification passed');
  } catch(error) {
    console.error(error?.stack||error);
    process.exitCode=1;
  } finally {
    if(browser){ log('closing Chromium'); await browser.close(); }
  }
})();

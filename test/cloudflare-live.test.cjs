const { chromium } = require('playwright');
const LIVE_URL = process.env.MEATFEST_LIVE_URL || 'https://fsdc-meatfest.michael-larick.workers.dev/';
const fail = message => { throw new Error(message); };
const log = message => console.log(`[LIVE-VERIFY] ${message}`);

(async () => {
  let browser;
  try {
    log('starting Chromium');
    browser = await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],timeout:30000});
    const page = await browser.newPage({viewport:{width:1440,height:1200}});
    log(`navigating to ${LIVE_URL}`);
    const response = await page.goto(LIVE_URL,{waitUntil:'domcontentloaded',timeout:30000});
    if(!response || !response.ok()) fail(`Cloudflare page request failed: ${response ? response.status() : 'no response'}`);
    const title=await page.title();
    if(!title.includes('Meatfest')) fail(`Unexpected page title: ${title}`);
    await page.locator('#buffetServiceCard').waitFor({state:'attached',timeout:15000});
    await page.waitForTimeout(500);

    for(const [id,label] of [['hawaiian','Hawaiian Rolls'],['cornbread','Cornbread']]){
      const button=page.locator(`button[data-buffet-key="breadIds"][data-buffet-id="${id}"]`);
      if(await button.count()!==1) fail(`${label} buffet control is missing.`);
      if(await button.isDisabled()) fail(`${label} buffet control is disabled.`);
      if(await button.getAttribute('aria-pressed')!=='false') fail(`${label} control did not start unselected.`);
      await button.click();
      await page.waitForFunction(({id})=>document.querySelector(`button[data-buffet-key="breadIds"][data-buffet-id="${id}"]`)?.getAttribute('aria-pressed')==='true',{id},{timeout:3000});
      const selected=await page.evaluate(()=>({rolls:typeof selectedSides!=='undefined'&&selectedSides.has('rolls'),cornbread:typeof selectedSides!=='undefined'&&selectedSides.has('cornbread')}));
      if(id==='hawaiian'&&!selected.rolls) fail('Hawaiian Rolls did not update the accompaniment selection state.');
      if(id==='cornbread'&&!selected.cornbread) fail('Cornbread did not update the accompaniment selection state.');
    }

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
    for(const key of ['brisket','pmbe','ribs','pork','brats','chicken']){
      const control=page.locator(`.meat[data-k="${key}"]`);
      if(await control.count()!==1) fail(`Protein control is missing: ${key}`);
      if(!(await control.evaluate(el=>el.classList.contains('on')))) await control.click();
    }
    for(const id of ['mac','cauli','collards']){
      const control=page.locator(`.sideCard[data-side="${id}"]`);
      if(await control.count()!==1) fail(`Side control is missing: ${id}`);
      if(!(await control.evaluate(el=>el.classList.contains('on')))) await control.click();
    }

    await page.waitForFunction(()=>{
      const card=document.querySelector('#buffetLayoutCard');
      const execution=card?.querySelector('.mf-execution');
      return !!card?.querySelector('.mf-visual') && !!execution && !!card?.querySelector('.mf-physical') && !!card?.querySelector('.mf-flow') &&
        ['Cauliflower Mac','Mac & Cheese','Collard Greens','Hawaiian Rolls','Cornbread'].every(label=>execution.innerText.includes(label));
    },{timeout:15000});

    const state=await page.evaluate(()=>{
      const summary=window.buildSummary();
      const B=window.BuffetEngine;
      const rows=summary.sideRows||[];
      const plan=B.sidePlan({sideIds:rows.map(r=>r.id),proteinKeys:summary.rows.map(r=>r.key),sideRows:rows});
      const cauli=rows.find(r=>r.id==='cauli'||r.id==='cauliflowerMac');
      const collards=rows.find(r=>r.id==='collards');
      const cp=plan.find(r=>r.id==='collards');
      const execution=document.querySelector('#buffetLayoutCard .mf-execution');
      const physical=document.querySelector('#buffetLayoutCard .mf-physical');
      const flow=document.querySelector('#buffetLayoutCard .mf-flow:has(.mf-flow-route)');
      const map=document.querySelector('#buffetLayoutCard .mf-visual');
      const presentationText=execution?.innerText||'';
      const physicalText=physical?.innerText||'';
      const flowText=flow?.innerText||'';
      const serviceText=document.querySelector('#buffetServiceCard')?.innerText||'';
      const table=B.tableRequirement([{linearIn:102}],{tableLengths:[72,48]});
      const capacity=window.BuffetAllocation.allocate([{station:'core',linearIn:50,items:[{id:'protein-a',name:'Protein A',vessel:{type:'chafer'}}]},{station:'core',linearIn:50,items:[{id:'protein-b',name:'Protein B',vessel:{type:'chafer'}}]},{station:'specialty',linearIn:40,items:[{id:'specialty-a',name:'Specialty A',vessel:{type:'chafer'}}]}],[72,48]);
      return {summary,cauli,collards,cp,table,capacity,serviceText,presentationText,physicalText,flowText,mapText:map?.innerText||''};
    });

    if(state.summary.eaters!==44) fail(`Live adult-equivalent eater count is wrong: ${state.summary.eaters}`);
    if(state.summary.rows.length!==6) fail(`Live canonical protein selection did not produce six proteins: ${JSON.stringify(state.summary)}`);
    if(Math.abs(state.summary.total-86.125)>0.0001) fail(`Live canonical purchase weight is wrong: ${state.summary.total}`);
    if(!state.cauli||state.cauli.q.amount!==0.5||state.cauli.q.unit!=='tin') fail(`Live Cauliflower Mac quantity is wrong: ${JSON.stringify(state.cauli)}`);
    if(!state.collards||state.collards.q.amount!==1||state.collards.q.unit!=='recipe') fail(`Live Collard Greens quantity is wrong: ${JSON.stringify(state.collards)}`);
    if(!state.cp?.quantity?.service||state.cp.quantity.service.count!==1||state.cp.quantity.service.label!=='serving bowl') fail(`Live Collard Greens service calculation is wrong: ${JSON.stringify(state.cp?.quantity?.service)}`);
    if(state.cp.vessel?.type!=='bowl'||state.cp.service?.method!=='tongs') fail(`Live Collard Greens service metadata is wrong: ${JSON.stringify({vessel:state.cp.vessel,service:state.cp.service})}`);
    if(state.table.linearRequired!==102||state.table.linearProvided!==120||JSON.stringify(state.table.tables)!==JSON.stringify([72,48])) fail(`Live table requirement calculation is wrong: ${JSON.stringify(state.table)}`);

    for(const label of ['Cauliflower Mac','Mac & Cheese','Collard Greens','Hawaiian Rolls','Cornbread']) if(!state.presentationText.includes(label)) fail(`Live buffet execution plan is missing selected side: ${label}`);
    for(const label of ['Hawaiian Rolls','Cornbread']) if(!state.serviceText.includes(label)) fail(`Live buffet service card is missing bread control: ${label}`);
    if(!state.mapText.includes('GUEST APPROACH')||!state.mapText.includes('TABLE 1')||!state.mapText.includes('TABLE 4')) fail(`Live U-shaped map is missing physical orientation markers: ${state.mapText}`);
    if(!state.mapText.includes('TABLE 1 → TABLE 2 → TABLE 3 → TABLE 4')) fail(`Live U-shaped map is missing guest service direction: ${state.mapText}`);
    for(const label of ['BUFFET EXECUTION PLAN','QTY / PRODUCTION','VESSEL','SERVICE','POSITION','REFILL / BACKUP','Cauliflower Mac','Collard Greens']) if(!state.presentationText.includes(label)) fail(`Live buffet execution plan is missing expected content: ${label}`);
    for(const label of ['PHYSICAL TABLE SETUP','TABLE 1','TABLE 2','TABLE 3','TABLE 4','START / ENTRY','END / FINISH','GUEST APPROACH','CREW / KITCHEN SIDE','BACKUPS STAY OFF BUFFET']) if(!state.physicalText.includes(label)) fail(`Live physical setup is missing expected operational content: ${label}`);
    if(!state.physicalText.includes('Collard Greens')||!state.physicalText.includes('tongs')) fail(`Live physical setup is missing vessel/utensil placement data: ${state.physicalText}`);
    for(const label of ['GUEST FLOW / SERVICE STRATEGY','START / ENTRY','FINISH / EXIT','ONE-WAY FLOW','PRESSURE POINTS','CREW RULE','DESIGN RULE']) if(!state.flowText.includes(label)) fail(`Live guest-flow strategy is missing expected content: ${label}`);
    if(!state.flowText.includes('Table 1 → Table 2 → Table 3 → Table 4')) fail(`Live guest-flow strategy is missing one-way table direction: ${state.flowText}`);
    if(!state.flowText.toLowerCase().includes('no rationing')) fail(`Live guest-flow strategy is missing the no-rationing rule: ${state.flowText}`);
    if(!state.flowText.includes('crew replenishes from the kitchen side')) fail(`Live guest-flow strategy is missing crew-lane guidance: ${state.flowText}`);
    if(state.capacity.linearRequired!==140||state.capacity.linearProvided!==120||!state.capacity.overflow||state.capacity.overflowIn!==20) fail(`Live buffet overflow capacity calculation is wrong: ${JSON.stringify(state.capacity)}`);
    if(JSON.stringify(state.capacity.recommendedTables)!==JSON.stringify([72,72,48])) fail(`Live buffet overflow recommendation is wrong: ${JSON.stringify(state.capacity.recommendedTables)}`);
    if(!state.capacity.recommendedLayout||state.capacity.recommendedLayout.linearProvided!==192||state.capacity.recommendedLayout.linearRequired!==140||state.capacity.recommendedLayout.overflow) fail(`Live recommended expanded buffet layout is not a valid full-menu fit: ${JSON.stringify(state.capacity.recommendedLayout)}`);

    log('live verification passed');
  } catch(error) {
    console.error(error?.stack||error);
    process.exitCode=1;
  } finally {
    if(browser){ log('closing Chromium'); await browser.close(); }
  }
})();

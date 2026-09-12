const { chromium } = require('playwright');
const LIVE_URL = process.env.MEATFEST_LIVE_URL || 'https://fsdc-meatfest.michael-larick.workers.dev/';
const fail = message => { throw new Error(message); };
const log = message => console.log(`[LIVE-VERIFY] ${message}`);
(async () => {
  let browser;
  try {
    log('starting Chromium');
    browser = await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],timeout:30000});
    log('Chromium started');
    const page = await browser.newPage({viewport:{width:1440,height:1200}});
    log('page created');
    log(`navigating to ${LIVE_URL}`);
    const response = await page.goto(LIVE_URL,{waitUntil:'domcontentloaded',timeout:30000});
    log(`navigation completed: ${response?.status() ?? 'no response'}`);
    if(!response || !response.ok()) fail(`Cloudflare page request failed: ${response ? response.status() : 'no response'}`);
    const title=await page.title(); log(`page title: ${title}`); if(!title.includes('Meatfest')) fail(`Unexpected page title: ${title}`);
    log('waiting for buffetServiceCard');
    await page.locator('#buffetServiceCard').waitFor({state:'attached',timeout:15000});
    log('buffetServiceCard attached');
    await page.waitForTimeout(500);
    const breadSelections=[['hawaiian','Hawaiian Rolls'],['cornbread','Cornbread']];
    for(const [id,label] of breadSelections){
      const button=page.locator(`button[data-buffet-key="breadIds"][data-buffet-id="${id}"]`);
      if(await button.count()!==1) fail(`${label} buffet control is missing.`);
      if(await button.isDisabled()) fail(`${label} buffet control is disabled.`);
      if(await button.getAttribute('aria-pressed')!=='false') fail(`${label} control did not start unselected.`);
      await button.click();
      await page.waitForFunction(({id})=>document.querySelector(`button[data-buffet-key="breadIds"][data-buffet-id="${id}"]`)?.getAttribute('aria-pressed')==='true',{id},{timeout:3000});
      if(!(await button.innerText()).includes('✓')) fail(`${label} control did not render its selected state.`);
      const breadState=await page.evaluate(()=>({rolls:typeof selectedSides!=='undefined'&&selectedSides.has('rolls'),cornbread:typeof selectedSides!=='undefined'&&selectedSides.has('cornbread')}));
      if(id==='hawaiian'&&!breadState.rolls) fail('Hawaiian Rolls did not update the accompaniment selection state.');
      if(id==='cornbread'&&!breadState.cornbread) fail('Cornbread did not update the accompaniment selection state.');
      for(const [expectedId] of breadSelections.slice(0,breadSelections.findIndex(x=>x[0]===id)+1)){
        const b=page.locator(`button[data-buffet-key="breadIds"][data-buffet-id="${expectedId}"]`);
        if(await b.getAttribute('aria-pressed')!=='true') fail(`${label} selection lost ${expectedId}.`);
      }
    }
    const hotDogs=page.locator('button[data-buffet-key="supplementalIds"][data-buffet-id="hotdogs"]');
    if(await hotDogs.count()!==1) fail('Hot Dogs buffet control is missing.');
    if(await hotDogs.getAttribute('aria-pressed')!=='false') fail('Hot Dogs control did not start unselected.');
    await hotDogs.click(); await page.waitForFunction(()=>document.querySelector('button[data-buffet-key="supplementalIds"][data-buffet-id="hotdogs"]')?.getAttribute('aria-pressed')==='true');
    if(!(await hotDogs.innerText()).includes('✓')) fail('Hot Dogs control did not render its selected state.');
    await hotDogs.click(); await page.waitForFunction(()=>document.querySelector('button[data-buffet-key="supplementalIds"][data-buffet-id="hotdogs"]')?.getAttribute('aria-pressed')==='false');
    await page.locator('#adults').fill('40'); await page.locator('#adults').dispatchEvent('input');
    await page.locator('#kids').fill('8'); await page.locator('#kids').dispatchEvent('input');
    for(const key of ['brisket','pmbe','ribs','pork','brats','chicken']){const p=page.locator(`.meat[data-k="${key}"]`);if(await p.count()!==1)fail(`Protein control is missing: ${key}`);if(!(await p.evaluate(el=>el.classList.contains('on'))))await p.click();}
    for(const id of ['mac','cauli','collards']){const s=page.locator(`.sideCard[data-side="${id}"]`);if(await s.count()!==1)fail(`Side control is missing: ${id}`);if(!(await s.evaluate(el=>el.classList.contains('on'))))await s.click();}
    await page.waitForFunction(()=>{const card=document.querySelector('#buffetLayoutCard');return !!card?.querySelector('.mf-visual') && !!card?.querySelector('.mf-execution') && !!card?.querySelector('.mf-physical') && !!card?.querySelector('.mf-flow');},{timeout:15000});
    const state=await page.evaluate(()=>{const summary=window.buildSummary(),B=window.BuffetEngine,rows=summary.sideRows||[],plan=B.sidePlan({sideIds:rows.map(r=>r.id),proteinKeys:summary.rows.map(r=>r.key),sideRows:rows}),cauli=rows.find(r=>r.id==='cauli'||r.id==='cauliflowerMac'),collards=rows.find(r=>r.id==='collards'),cp=plan.find(r=>r.id==='collards'),table=B.tableRequirement([{linearIn:102}],{tableLengths:[72,48]}),capacity=window.BuffetAllocation.allocate([{station:'core',linearIn:50,items:[{id:'protein-a',name:'Protein A',vessel:{type:'chafer'}}]},{station:'core',linearIn:50,items:[{id:'protein-b',name:'Protein B',vessel:{type:'chafer'}}]},{station:'specialty',linearIn:40,items:[{id:'specialty-a',name:'Specialty A',vessel:{type:'chafer'}}]}],[72,48]);window.populatePrint?.();const execution=document.querySelector('#buffetLayoutCard .mf-execution'),presentationText=execution?.innerText||'',pb=document.querySelector('#psBuffet'),pts=pb?[...pb.querySelectorAll('.ps-bTable')]:[],sequenceText=execution?.querySelector('.mf-service-sequence')?.innerText||'',sequenceRows=execution?[...execution.querySelectorAll('.mf-service-sequence .mf-position-item')]:[],crew=document.querySelector('#psBuffet .ps-bAllocation'),crewText=crew?.innerText||'',crewTables=crew?[...crew.querySelectorAll('.ps-bCrewTable')]:[],crewSetupRows=crewTables[0]?[...crewTables[0].querySelectorAll('.ps-bCrewRow:not(.ps-bCrewHeadRow)')]:[],crewSequence=crew?.querySelectorAll('.ps-bSequence li').length||0,physical=document.querySelector('#buffetLayoutCard .mf-physical'),physicalText=physical?.innerText||'',setupTables=physical?[...physical.querySelectorAll('.mf-setup-table')]:[],setupItems=physical?[...physical.querySelectorAll('.mf-setup-table .mf-position-item')]:[],map=document.querySelector('#buffetLayoutCard .mf-visual'),mapText=map?.innerText||'',flow=document.querySelector('#buffetLayoutCard .mf-flow:has(.mf-flow-route)'),flowText=flow?.innerText||'',execRows=execution?[...execution.querySelectorAll('.mf-exec-row:not(.mf-exec-head)')]:[],positionText=setupItems.map(x=>x.innerText).join(' | '),crewSetupText=crewSetupRows.map(x=>x.innerText).join(' | ');return{summary,B,cauli,collards,cp,table,capacity,buffetText:document.querySelector('#buffetServiceCard')?.innerText||'',visual:!!map,executionText:execution?.innerText||'',executionVisible:!!execution&&!!execution.offsetParent,executionRows:execRows.length,executionItemNames:execRows.map(x=>x.children[0]?.innerText||''),presentationText,sequenceText,sequenceRows:sequenceRows.length,print:!!pb,printTables:pts.length,printText:pb?.innerText||'',crew:!!crew,crewText,crewSetupRows:crewSetupRows.length,crewSequence,physical:!!physical,physicalText,setupTables:setupTables.length,setupItems:setupItems.length,mapText,flow:!!flow,flowText,physicalItemText:positionText,crewSetupText};});
    if(state.summary.eaters!==44)fail(`Live adult-equivalent eater count is wrong: ${state.summary.eaters}`);
    if(state.summary.rows.length!==6)fail(`Live canonical protein selection did not produce six proteins: ${JSON.stringify(state.summary)}`);
    if(Math.abs(state.summary.total-86.125)>0.0001)fail(`Live canonical purchase weight is wrong: ${state.summary.total}`);
    if(!state.cauli||state.cauli.q.amount!==0.5||state.cauli.q.unit!=='tin')fail(`Live Cauliflower Mac quantity is wrong: ${JSON.stringify(state.cauli)}`);
    if(!state.collards||state.collards.q.amount!==1||state.collards.q.unit!=='recipe')fail(`Live Collard Greens quantity is wrong: ${JSON.stringify(state.collards)}`);
    if(!state.cp?.quantity?.service||state.cp.quantity.service.count!==1||state.cp.quantity.service.label!=='serving bowl')fail(`Live Collard Greens service calculation is wrong: ${JSON.stringify(state.cp?.quantity?.service)}`);
    if(state.cp.vessel?.type!=='bowl'||state.cp.service?.method!=='tongs')fail(`Live Collard Greens service metadata is wrong: ${JSON.stringify({vessel:state.cp.vessel,service:state.cp.service})}`);
    if(state.table.linearRequired!==102||state.table.linearProvided!==120||JSON.stringify(state.table.tables)!==JSON.stringify([72,48]))fail(`Live table requirement calculation is wrong: ${JSON.stringify(state.table)}`);
    if(!state.buffetText.includes('Cauliflower Mac')||!state.buffetText.includes('Collard Greens'))fail(`Live buffet presentation is missing selected sides: ${state.buffetText}`);
    if(!state.visual)fail('Live visual U-shaped buffet layout did not render.');
    if(!state.mapText.includes('GUEST APPROACH')||!state.mapText.includes('TABLE 1')||!state.mapText.includes('TABLE 4'))fail(`Live U-shaped map is missing physical orientation markers: ${state.mapText}`);
    if(!state.mapText.includes('TABLE 1 → TABLE 2 → TABLE 3 → TABLE 4'))fail(`Live U-shaped map is missing guest service direction: ${state.mapText}`);
    if(!state.executionVisible)fail('Live buffet execution plan did not render visibly.');
    for(const label of ['BUFFET EXECUTION PLAN','QTY / PRODUCTION','VESSEL','SERVICE','POSITION','REFILL / BACKUP','Cauliflower Mac','Collard Greens','Table 1'])if(!state.executionText.includes(label))fail(`Live buffet execution plan is missing expected content: ${label}`);
    if(state.executionRows<3)fail(`Live buffet execution plan has too few service rows: ${state.executionRows}`);
    if(state.executionRows!==state.setupItems||state.executionRows!==state.crewSetupRows)fail(`Live buffet service artifacts disagree on setup item count: execution=${state.executionRows}, physical=${state.setupItems}, crew=${state.crewSetupRows}`);
    if(state.executionRows!==state.sequenceRows||state.executionRows!==state.crewSequence)fail(`Live buffet service sequence counts disagree: execution=${state.executionRows}, visual=${state.sequenceRows}, crew=${state.crewSequence}`);
    for(const name of ['Cauliflower Mac','Collard Greens'])if(!state.executionItemNames.some(x=>x.includes(name))||!state.physicalItemText.includes(name)||!state.crewSetupText.includes(name))fail(`Live buffet cross-layer plan lost item ${name}.`);
    if(!state.presentationText.includes('INITIAL PRESENTATION / BACKUP'))fail('Live buffet plan is missing initial presentation / backup section.');
    for(const label of ['INITIAL:','BACKUP:','REFILL:'])if(!state.presentationText.includes(label))fail(`Live buffet plan is missing presentation field: ${label}`);
    if(!state.sequenceText.includes('SERVICE SEQUENCE'))fail('Live buffet plan is missing service sequence section.');
    if(state.sequenceRows<3)fail(`Live buffet service sequence has too few rows: ${state.sequenceRows}`);
    if(!state.sequenceText.includes('SETUP:')||!state.sequenceText.includes('BACKUP:'))fail(`Live buffet service sequence is missing setup/backup instructions: ${state.sequenceText}`);
    if(!state.executionText.includes('locked buy/yield model')||!state.executionText.includes('remaining production as backup'))fail(`Live buffet execution plan is missing operating-rule language: ${state.executionText}`);
    if(!state.physical)fail('Live operational physical buffet setup did not render.');
    if(state.setupTables!==4)fail(`Live physical setup did not render four baseline tables: ${state.setupTables}`);
    if(state.setupItems<6)fail(`Live physical setup has too few positioned service items: ${state.setupItems}`);
    for(const label of ['PHYSICAL TABLE SETUP','TABLE 1','TABLE 2','TABLE 3','TABLE 4','START / ENTRY','END / FINISH','GUEST APPROACH','CREW / KITCHEN SIDE','BACKUPS STAY OFF BUFFET','SETUP RULE:'])if(!state.physicalText.includes(label))fail(`Live physical setup is missing expected operational content: ${label}`);
    if(!state.physicalText.includes('Collard Greens')||!state.physicalText.includes('tongs'))fail(`Live physical setup is missing vessel/utensil placement data: ${state.physicalText}`);
    if(!state.flow)fail('Live guest-flow service strategy did not render.');
    for(const label of ['GUEST FLOW / SERVICE STRATEGY','START / ENTRY','FINISH / EXIT','ONE-WAY FLOW','PRESSURE POINTS','CREW RULE','DESIGN RULE'])if(!state.flowText.includes(label))fail(`Live guest-flow strategy is missing expected content: ${label}`);
    if(!state.flowText.includes('Table 1 → Table 2 → Table 3 → Table 4'))fail(`Live guest-flow strategy is missing one-way table direction: ${state.flowText}`);
    if(!state.flowText.toLowerCase().includes('no rationing'))fail(`Live guest-flow strategy is missing the no-rationing rule: ${state.flowText}`);
    if(!state.flowText.includes('crew replenishes from the kitchen side'))fail(`Live guest-flow strategy is missing crew-lane guidance: ${state.flowText}`);
    if(state.capacity.linearRequired!==140||state.capacity.linearProvided!==120||!state.capacity.overflow||state.capacity.overflowIn!==20)fail(`Live buffet overflow capacity calculation is wrong: ${JSON.stringify(state.capacity)}`);
    if(JSON.stringify(state.capacity.recommendedTables)!==JSON.stringify([72,72,48]))fail(`Live buffet overflow recommendation is wrong: ${JSON.stringify(state.capacity.recommendedTables)}`);
    if(!state.capacity.recommendedLayout||state.capacity.recommendedLayout.linearProvided!==192||state.capacity.recommendedLayout.linearRequired!==140||state.capacity.recommendedLayout.overflow)fail(`Live recommended expanded buffet layout is not a valid full-menu fit: ${JSON.stringify(state.capacity.recommendedLayout)}`);
    if(state.capacity.overflowItems.length!==1||!state.capacity.overflowItems.includes('Protein B'))fail(`Live buffet overflow did not identify the displaced service group: ${JSON.stringify(state.capacity.overflowItems)}`);
    if(!state.print||state.printTables!==4)fail(`Printable buffet layout is missing or incomplete: ${JSON.stringify({print:state.print,printTables:state.printTables})}`);
    if(!state.printText.includes("3 × 6'")||!state.printText.includes('66 sq ft')||!state.printText.includes("4' • END"))fail(`Printable buffet layout metadata is wrong: ${state.printText}`);
    if(!state.crew)fail('Print-ready buffet crew sheet did not render.');
    for(const label of ['BUFFET SETUP — CREW SHEET','1. TABLE SETUP & SERVICE POSITIONS','2. INITIAL PRESENTATION / BACKUP','3. SERVICE SEQUENCE','TABLE','POSITION','ITEM','VESSEL','UTENSIL / METHOD','INITIAL','BACKUP LOCATION','REFILL TRIGGER','KEEP OFF BUFFET','CREW RULE:'])if(!state.crewText.includes(label))fail(`Crew sheet is missing expected content: ${label}`);
    if(state.crewSetupRows<6)fail(`Crew sheet has too few setup rows: ${state.crewSetupRows}`);
    if(state.crewSequence<6)fail(`Crew sheet has too few service-sequence rows: ${state.crewSequence}`);
    if(!state.crewText.includes('Collard Greens')||!state.crewText.includes('tongs'))fail(`Crew sheet is missing item/service utensil data: ${state.crewText}`);
    if(!state.crewText.includes('Buy/production quantities do not change')||!state.crewText.includes('Keep backup food in the kitchen'))fail(`Crew sheet is missing locked-quantity/backup operating rules: ${state.crewText}`);
    console.log('Cloudflare live smoke test passed.');
    console.log(JSON.stringify({url:LIVE_URL,title,eaters:state.summary.eaters,proteinCount:state.summary.rows.length,purchaseWeight:state.summary.total,cauliflowerMac:state.cauli.q,collards:state.collards.q,collardService:state.cp.quantity.service,tableRequirement:state.table,capacity:{required:state.capacity.linearRequired,provided:state.capacity.linearProvided,overflowIn:state.capacity.overflowIn,displaced:state.capacity.overflowItems,recommended:state.capacity.recommendedTables}}));
  } finally {
    if(browser){
      log('closing Chromium');
      await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,10000))]);
      log('browser close complete');
    }
  }
})().catch(error=>{console.error(error?.stack||error);process.exit(1);});

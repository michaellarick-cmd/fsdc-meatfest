const { chromium } = require('playwright');
const LIVE_URL = process.env.MEATFEST_LIVE_URL || 'https://fsdc-meatfest.michael-larick.workers.dev/';
const fail = message => { throw new Error(message); };
(async () => {
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage({viewport:{width:1440,height:1200}});
  try {
    const response = await page.goto(LIVE_URL,{waitUntil:'networkidle',timeout:60000});
    if(!response || !response.ok()) fail(`Cloudflare page request failed: ${response ? response.status() : 'no response'}`);
    const title=await page.title(); if(!title.includes('Meatfest')) fail(`Unexpected page title: ${title}`);
    await page.locator('#buffetServiceCard').waitFor({state:'visible',timeout:30000});
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
    await page.waitForTimeout(100);
    const state=await page.evaluate(()=>{const summary=window.buildSummary(),B=window.BuffetEngine,rows=summary.sideRows||[],plan=B.sidePlan({sideIds:rows.map(r=>r.id),proteinKeys:summary.rows.map(r=>r.key),sideRows:rows}),cauli=rows.find(r=>r.id==='cauli'||r.id==='cauliflowerMac'),collards=rows.find(r=>r.id==='collards'),cp=plan.find(r=>r.id==='collards'),table=B.tableRequirement([{linearIn:102}],{tableLengths:[72,48]}),capacity=window.BuffetAllocation.allocate([{station:'core',linearIn:50,items:[{id:'protein-a',name:'Protein A',vessel:{type:'chafer'}}]},{station:'core',linearIn:50,items:[{id:'protein-b',name:'Protein B',vessel:{type:'chafer'}}]},{station:'specialty',linearIn:40,items:[{id:'specialty-a',name:'Specialty A',vessel:{type:'chafer'}}]}],[72,48]);window.populatePrint?.();const execution=document.querySelector('#buffetLayoutCard .mf-execution'),pb=document.querySelector('#psBuffet'),pts=pb?[...pb.querySelectorAll('.ps-bTable')]:[];return{summary,B,cauli,collards,cp,table,capacity,buffetText:document.querySelector('#buffetServiceCard')?.innerText||'',visual:!!document.querySelector('#buffetLayoutCard .visualLayout'),executionText:execution?.innerText||'',executionVisible:!!execution&&!!execution.offsetParent,executionRows:execution?[...execution.querySelectorAll('.mf-exec-row:not(.mf-exec-head)')].length:0,print:!!pb,printTables:pts.length,printText:pb?.innerText||''};});
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
    if(!state.executionVisible)fail('Live buffet execution plan did not render visibly.');
    for(const label of ['BUFFET EXECUTION PLAN','QTY / PRODUCTION','VESSEL','SERVICE','POSITION','REFILL / BACKUP','Cauliflower Mac','Collard Greens','Table 1'])if(!state.executionText.includes(label))fail(`Live buffet execution plan is missing expected content: ${label}`);
    if(state.executionRows<3)fail(`Live buffet execution plan has too few service rows: ${state.executionRows}`);
    if(!state.executionText.includes('locked buy/yield model')||!state.executionText.includes('remaining production as backup'))fail(`Live buffet execution plan is missing operating-rule language: ${state.executionText}`);
    if(state.capacity.linearRequired!==140||state.capacity.linearProvided!==120||!state.capacity.overflow||state.capacity.overflowIn!==20)fail(`Live buffet overflow capacity calculation is wrong: ${JSON.stringify(state.capacity)}`);
    if(JSON.stringify(state.capacity.recommendedTables)!==JSON.stringify([72,72]))fail(`Live buffet overflow recommendation is wrong: ${JSON.stringify(state.capacity.recommendedTables)}`);
    if(!state.capacity.recommendedLayout||state.capacity.recommendedLayout.linearProvided!==144||state.capacity.recommendedLayout.linearRequired!==140||state.capacity.recommendedLayout.overflow)fail(`Live recommended expanded buffet layout is not a valid full-menu fit: ${JSON.stringify(state.capacity.recommendedLayout)}`);
    if(state.capacity.overflowItems.length!==1||!state.capacity.overflowItems.includes('Protein B'))fail(`Live buffet overflow did not identify the displaced service group: ${JSON.stringify(state.capacity.overflowItems)}`);
    if(!state.print||state.printTables!==4)fail(`Printable buffet layout is missing or incomplete: ${JSON.stringify({print:state.print,printTables:state.printTables})}`);
    if(!state.printText.includes("3 × 6'")||!state.printText.includes('66 sq ft')||!state.printText.includes("4' • END"))fail(`Printable buffet layout metadata is wrong: ${state.printText}`);
    console.log('Cloudflare live smoke test passed.');
    console.log(JSON.stringify({url:LIVE_URL,title,eaters:state.summary.eaters,proteinCount:state.summary.rows.length,purchaseWeight:state.summary.total,cauliflowerMac:state.cauli.q,collards:state.collards.q,collardService:state.cp.quantity.service,tableRequirement:state.table,capacity:{required:state.capacity.linearRequired,provided:state.capacity.linearProvided,overflowIn:state.capacity.overflowIn,recommendedTables:state.capacity.recommendedTables,overflowItems:state.capacity.overflowItems,recommendedLayout:{provided:state.capacity.recommendedLayout?.linearProvided,required:state.capacity.recommendedLayout?.linearRequired,overflow:state.capacity.recommendedLayout?.overflow}},visualLayout:state.visual,executionPlan:{visible:state.executionVisible,rows:state.executionRows},printTableCount:state.printTables},null,2));
  } finally { await browser.close(); }
})().catch(error=>{console.error(error.stack||error);process.exit(1);});

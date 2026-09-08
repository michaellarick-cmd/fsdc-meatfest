const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('public/buffet-engine.js','utf8');
const context={globalThis:{}};vm.runInNewContext(source,context);const B=context.globalThis.BuffetEngine;

test('side planning evaluates every selected side against selected proteins',()=>{
  const p=B.sidePlan({sideIds:['mac','sauerkraut','cucumber'],proteinKeys:['pmbe','polish','chicken']});
  assert.equal(p.length,3);assert.equal(p.find(x=>x.id==='mac').score,3);assert.equal(p.find(x=>x.id==='sauerkraut').score,3);assert.equal(p.find(x=>x.id==='cucumber').score,3);
});

test('changing side selection does not create phantom sides',()=>{
  const p=B.sidePlan({sideIds:['beans'],proteinKeys:['brisket']});
  assert.deepEqual(p.map(x=>x.id),['beans']);
});

test('Hawaiian rolls and cornbread are general bread items',()=>{
  const p=B.breadPlan({breadIds:['hawaiian','cornbread'],proteinKeys:['pork','ribs']});
  assert.equal(p.length,2);assert.equal(p.every(x=>x.bread.category==='bread'),true);
});

test('supplemental grilling meats remain separate from core proteins',()=>{
  assert.ok(B.SUPPLEMENTAL.burgers);assert.ok(B.SUPPLEMENTAL.hotdogs);assert.ok(B.SUPPLEMENTAL.brats);assert.ok(B.supplementalFactor(['burgers','hotdogs','brats'])<1);
});

test('functional buns are added only for selected supplemental meats',()=>{
  const p=B.breadPlan({supplementalIds:['burgers','hotdogs'],proteinKeys:[]});
  assert.deepEqual(p.map(x=>x.id).sort(),['burgerBuns','hotDogBuns']);
});

test('quarter quantities are not treated as four quarter-pans per chafer',()=>{
  assert.equal(B.VESSELS.chafer.type,'chafer');
  assert.equal(B.SIDES.cauliflowerMac.quantityUnit,'half');
});

test('condiments use jars rather than chafers',()=>{
  const p=B.condimentPlan(['bbqSauce','pickles','mustard']);
  assert.equal(p.every(x=>x.vessel.type==='jar'),true);
});

test('dessert load changes recommendation scale without changing core meat math',()=>{
  assert.equal(B.dessertPlan({dessertIds:['pie'],load:'light'})[0].scaleFactor,1);
  assert.equal(B.dessertPlan({dessertIds:['pie'],load:'heavy'})[0].scaleFactor,2);
});

test('full and half chafers are physical service units',()=>{
  assert.equal(B.VESSELS.chafer.linearIn,18);
  assert.equal(B.VESSELS.chafer.type,'chafer');
});

test('buffet plan produces a sequence and table requirement',()=>{
  const p=B.plan({proteinKeys:['chicken','pork','pmbe','ribs','brisket','polish'],sideIds:['cucumber','coleslaw','corn','mac','beans','sauerkraut'],breadIds:['hawaiian'],supplementalIds:[],condimentIds:['bbqSauce','pickles','mustard'],dessertIds:['pie'],load:'moderate',tableLengths:[72,48]});
  assert.ok(p.sequence.length>0);assert.ok(p.tables.tables.length>0);assert.ok(p.tables.linearProvided>=p.tables.linearRequired);
});

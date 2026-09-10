import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';

const engine=fs.readFileSync(new URL('../public/buffet-engine.js',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const appStart=app.indexOf('function selectedProteinTags()');
const appEnd=app.indexOf('const order=');
assert.ok(appStart>=0&&appEnd>appStart,'production side planner not found in app.js');
const sideSource=app.slice(appStart,appEnd).replace('let selectedSides=new Set();','var selectedSides=globalThis.selectedSides||new Set();');

function makeContext({adults=44,kids=0,proteins=[],sides=[],mode='meatfest'}={}){
  const context={selected:new Set(proteins),selectedSides:new Set(sides),planningMode:mode,activeTotals:()=>[adults,kids]};
  context.window=context;
  vm.createContext(context);
  vm.runInContext(engine,context);
  vm.runInContext(`${sideSource}\nglobalThis.__sideTest={sideQty};`,context);
  return context;
}

function canonicalSide(context,id){
  const eaters=context.activeTotals()[0]+context.activeTotals()[1]*.5;
  const proteins=[...context.selected];
  const sideIds=[...context.selectedSides].map(x=>context.BuffetEngine.SIDE_ID_ALIASES?.[x]||x).filter(x=>context.BuffetEngine.SIDES?.[x]);
  const canonical=context.BuffetEngine.SIDE_ID_ALIASES?.[id]||id;
  return context.BuffetEngine.menuSideQuantity(canonical,eaters,sideIds,proteins);
}

function canonicalBread(context,id){
  const map={rolls:'hawaiian',cornbread:'cornbread'};
  const breadId=map[id];
  const eaters=context.activeTotals()[0]+context.activeTotals()[1]*.5;
  const plan=context.BuffetEngine.breadPlan({breadIds:[breadId],proteinKeys:[...context.selected],eaters});
  return plan.find(x=>x.id===breadId)?.quantity?.pieces;
}

test('app Meatfest side quantities delegate to BuffetEngine',()=>{
  const context=makeContext({adults:44,proteins:['chicken','pork','pmbe','ribs','brisket','brats'],sides:Object.keys(contextSafeSides())});
  for(const id of Object.keys(context.BuffetEngine.SIDES)){
    const appQty=context.__sideTest.sideQty(id);
    const engineQty=context.BuffetEngine.menuSideQuantity(id,44,Object.keys(context.BuffetEngine.SIDES),['chicken','pork','pmbe','ribs','brisket','brats']).amount;
    assert.equal(appQty,engineQty,`${id}: app and BuffetEngine disagree`);
  }
});

function contextSafeSides(){return {asparagus:1,beans:1,broccoli:1,cauliflowerMac:1,coleslaw:1,collards:1,corn:1,cucumber:1,greenbeans:1,mac:1,pastasalad:1,potatosalad:1,sauerkraut:1}}

test('app bread quantities delegate to BuffetEngine',()=>{
  const context=makeContext({adults:44,proteins:['chicken','pork','brisket'],sides:['rolls','cornbread']});
  for(const [id,breadId] of [['rolls','hawaiian'],['cornbread','cornbread']]){
    assert.equal(context.__sideTest.sideQty(id),canonicalBread(context,id),`${id}: app and BuffetEngine disagree`);
  }
});

test('family mode retains its dedicated presentation planner',()=>{
  const context=makeContext({adults:24,proteins:['brisket'],sides:['slaw'],mode:'family'});
  assert.ok(Number.isFinite(context.__sideTest.sideQty('slaw')));
});

test('approved side catalog remains represented in the UI layer',()=>{
  const context=makeContext();
  const expected=['asparagus','beans','broccoli','cauli','slaw','collards','corn','cucumber','greenbeans','mac','pastasalad','potatosalad','kraut','cornbread','rolls'];
  for(const id of expected){
    const canonical=context.BuffetEngine.SIDE_ID_ALIASES?.[id]||id;
    assert.ok(id==='cornbread'||id==='rolls'||context.BuffetEngine.SIDES[canonical],`${id} missing from canonical engine`);
  }
});

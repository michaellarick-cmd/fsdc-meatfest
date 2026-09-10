import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';

const engine=fs.readFileSync(new URL('../public/buffet-engine.js',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const appStart=app.indexOf('function selectedProteinTags()');
const appEnd=app.indexOf('const order=');
assert.ok(appStart>=0&&appEnd>appStart,'production side planner not found in app.js');

const context={selected:new Set(),selectedSides:new Set(),planningMode:'meatfest',activeTotals:()=>[44,0],window:null};
context.window=context;
vm.createContext(context);
vm.runInContext(engine,context);
vm.runInContext(`${app.slice(appStart,appEnd)}\nglobalThis.__sideTest={sideQty};`,context);
const {sideQty}=context.__sideTest;

function setPlan({adults=44,kids=0,proteins=[],sides=[],mode='meatfest'}){context.activeTotals=()=>[adults,kids];context.selected=new Set(proteins);context.selectedSides=new Set(sides);context.planningMode=mode}

test('app Meatfest side quantities delegate to BuffetEngine',()=>{
  const ids=Object.keys(context.BuffetEngine.SIDES);
  const proteins=['chicken','pork','pmbe','ribs','brisket','brats'];
  setPlan({adults:44,proteins,sides:ids});
  for(const id of ids){
    const appQty=sideQty(id);
    const engineQty=context.BuffetEngine.menuSideQuantity(id,44,ids,proteins).amount;
    assert.equal(appQty,engineQty,`${id}: app and BuffetEngine disagree`);
  }
});

test('app bread quantities delegate to BuffetEngine',()=>{
  const proteins=['chicken','pork','brisket'];
  setPlan({adults:44,proteins,sides:['rolls','cornbread']});
  for(const [id,breadId] of [['rolls','hawaiian'],['cornbread','cornbread']]){
    const appQty=sideQty(id);
    const engineQty=context.BuffetEngine.breadPlan({breadIds:[breadId],proteinKeys:proteins,eaters:44}).find(x=>x.id===breadId).quantity.pieces;
    assert.equal(appQty,engineQty,`${id}: app and BuffetEngine disagree`);
  }
});

test('family mode retains its dedicated presentation planner',()=>{
  setPlan({adults:24,proteins:['brisket'],sides:['slaw'],mode:'family'});
  assert.ok(Number.isFinite(sideQty('slaw')));
});

test('approved side catalog remains represented in the UI layer',()=>{
  const expected=['asparagus','beans','broccoli','cauli','slaw','collards','corn','cucumber','greenbeans','mac','pastasalad','potatosalad','kraut','cornbread','rolls'];
  for(const id of expected){
    const canonical=context.BuffetEngine.SIDE_ID_ALIASES?.[id]||id;
    assert.ok(id==='cornbread'||id==='rolls'||context.BuffetEngine.SIDES[canonical],`${id} missing from canonical engine`);
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';

const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const appStart=app.indexOf('const sides={');
const appEnd=app.indexOf('const order=');
assert.ok(appStart>=0&&appEnd>appStart,'production side planner not found in app.js');

const context={choices:{chicken:'whole'},selected:new Set(),selectedSides:new Set(),planningMode:'meatfest',activeTotals:()=>[48,0]};
vm.createContext(context);
vm.runInContext(`${app.slice(appStart,appEnd)}\nglobalThis.__sideTest={sides,sideOrder,sideQty,sideRecommendation,sideRecommendationMatrix};`,context);
const {sides,sideOrder,sideQty,sideRecommendation,sideRecommendationMatrix}=context.__sideTest;

const expectedOrder=['asparagus','beans','broccoli','cauli','slaw','collards','corn','cucumber','greenbeans','mac','pastasalad','potatosalad','kraut','cornbread','rolls'];

test('production side catalog is complete and correctly ordered',()=>{
  assert.deepEqual(Array.from(sideOrder),expectedOrder);
  for(const id of expectedOrder)assert.ok(sides[id],`${id} missing`);
  assert.equal(sides.cornbread.group,'accomp');
  assert.equal(sides.rolls.group,'accomp');
});

test('side quantities remain independent of recommendation status',()=>{
  for(const id of expectedOrder){const q=sideQty(id);assert.ok(Number.isFinite(q));assert.ok(q>0,`${id} quantity is not positive`)}
});

const matrix={
 chicken:['beans','cauli','corn','cucumber','greenbeans','mac','potatosalad','slaw','cornbread'],
 fish:['asparagus','beans','cucumber','greenbeans','slaw'],
 pulled_pork:['beans','cauli','mac','slaw','rolls'],
 whole_hog:['beans','collards','potatosalad','slaw','rolls'],
 brats:['kraut'],
 brisket:['beans','cauli','cucumber','greenbeans','mac','potatosalad','cornbread'],
 pmbe:['beans','cauli','corn','cucumber','mac','potatosalad','slaw','cornbread'],
 prime_rib:['asparagus','greenbeans','rolls'],
 ribs:['beans','corn','cucumber','greenbeans','potatosalad','slaw','cornbread','rolls'],
 turkey:['cauli','greenbeans','mac','potatosalad','rolls'],
 pork_belly_burnt_ends:['beans','cauli','cucumber','mac','potatosalad','slaw','cornbread']
};

test('recommendation matrix exactly matches the approved grid',()=>{
  for(const [protein,ids] of Object.entries(matrix)){
    assert.deepEqual(Array.from(sideRecommendationMatrix[protein]).sort(),ids.slice().sort(),`${protein} matrix mismatch`);
    context.selected=new Set([protein==='chicken'?'chicken':protein==='pulled_pork'?'pork':protein==='whole_hog'?'hog':protein==='prime_rib'?'prime':protein==='pork_belly_burnt_ends'?'pbbe':protein]);
    for(const id of expectedOrder)assert.equal(sideRecommendation(id),ids.includes(id),`${protein} / ${id}`);
  }
});

test('multiple proteins use OR recommendation logic',()=>{
  context.selected=new Set(['prime','brisket']);
  assert.equal(sideRecommendation('asparagus'),true);
  assert.equal(sideRecommendation('greenbeans'),true);
  assert.equal(sideRecommendation('mac'),true);
  assert.equal(sideRecommendation('cornbread'),true);
  assert.equal(sideRecommendation('beans'),true);
});

test('whole hog recommendations do not restrict side selection',()=>{
  context.selected=new Set(['hog']);
  for(const id of expectedOrder){context.selectedSides=new Set([id]);assert.ok(sides[id]);assert.ok(sideQty(id)>0)}
});

import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';

const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const final=fs.readFileSync(new URL('../public/meatfest-final.js',import.meta.url),'utf8');
const appStart=app.indexOf('function chickenPrep');
const appEnd=app.indexOf('function renderSideCards');
assert.ok(appStart>=0&&appEnd>appStart,'production side planner not found in app.js');
const finalStart=final.indexOf('Object.assign(sides, {');
const finalEnd=final.indexOf('  // Whole-hog preparation is a presentation choice');
assert.ok(finalStart>=0&&finalEnd>finalStart,'production side integration not found in meatfest-final.js');

const context={choices:{chicken:'whole'},selected:new Set(),selectedSides:new Set(),planningMode:'meatfest',activeTotals:()=>[48,0],meats:{},order:[]};
vm.createContext(context);
vm.runInContext(`${app.slice(appStart,appEnd)}\n${final.slice(finalStart,finalEnd)}\nglobalThis.__sideTest={sides,sideOrder,sideQty,sideRecommendation};`,context);
const {sides,sideOrder,sideQty,sideRecommendation}=context.__sideTest;
const restored=['asparagus','greenbeans','pastasalad','potatosalad'];
const expected=['asparagus','beans','broccoli','cauli','collards','corn','cucumber','greenbeans','kraut','mac','pastasalad','potatosalad','slaw','cornbread','rolls'];

test('production side catalog is complete and alphabetized',()=>{
  for(const id of restored){assert.ok(sides[id],`${id} missing`);assert.ok(sideOrder.includes(id),`${id} missing from order`);}
  assert.deepEqual(Array.from(sideOrder),expected);
});

test('restored side quantities are finite, positive, and monotonic',()=>{
  for(const id of restored){let previous=0;for(const eaters of [10,30,48,75,100]){context.activeTotals=()=>[eaters,0];const q=sideQty(id);assert.ok(Number.isFinite(q));assert.ok(q>0);assert.ok(q>=previous);previous=q;}}
});

test('prime rib recommends its complete agreed side set',()=>{
  context.selected=new Set(['prime']);
  for(const id of ['mac','greenbeans','asparagus','potatosalad','pastasalad','cornbread']) assert.equal(sideRecommendation(id),true,`${id} missing prime-rib recommendation`);
  assert.equal(sideRecommendation('beans'),false);
});

test('prime-rib-specific vegetables do not leak to unrelated proteins',()=>{
  for(const protein of ['chicken','turkey','fish','pork','brisket','pmbe','brats','ribs','hog']){
    context.selected=new Set([protein]);
    assert.equal(sideRecommendation('greenbeans'),false,`${protein} incorrectly recommends green beans`);
    assert.equal(sideRecommendation('asparagus'),false,`${protein} incorrectly recommends asparagus`);
  }
});

test('turkey inherits chicken recommendation behavior',()=>{
  context.selected=new Set(['turkey']);
  for(const id of ['cauli','slaw','broccoli','cucumber','corn','cornbread','rolls']) assert.equal(sideRecommendation(id),true,`${id} missing turkey recommendation`);
});

test('potato salad and pasta salad are general BBQ recommendations',()=>{
  for(const protein of ['prime','fish','pork','brisket','pmbe','brats','ribs','chicken','turkey']){
    context.selected=new Set([protein]);
    assert.equal(sideRecommendation('potatosalad'),true);
    assert.equal(sideRecommendation('pastasalad'),true);
  }
});
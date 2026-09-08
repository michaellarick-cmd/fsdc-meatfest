import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../public/buffet-engine.js',import.meta.url),'utf8');
const context={globalThis:{}};vm.runInNewContext(source,context);const B=context.globalThis.BuffetEngine;

test('side quantities scale by adult-equivalent eaters using practical units',()=>{
  const q=B.sideQuantity('mac',44); assert.equal(q.unit,'full'); assert.equal(q.amount,2);
  const q2=B.sideQuantity('sauerkraut',44); assert.equal(q2.unit,'full'); assert.equal(q2.amount,1);
});

test('side quantities never depend on another side being selected',()=>{
  const a=B.sideQuantity('mac',44); const b=B.sideQuantity('mac',44,{selectedSideIds:['mac','corn','beans']});
  assert.deepEqual(a,b);
});

test('half quantity is a food quantity, not four quarter pans',()=>{
  const q=B.sideQuantity('cauliflowerMac',44); assert.equal(q.unit,'half'); assert.equal(q.amount,1);
  assert.equal(B.packFoodQuantity({unit:'quarter',amount:2}).serviceVessels,1);
});

test('full chafer may hold one full or two half food quantities',()=>{
  assert.equal(B.chaferPacking([{unit:'full',amount:1}]).chafers,1);
  assert.equal(B.chaferPacking([{unit:'half',amount:2}]).chafers,1);
  assert.equal(B.chaferPacking([{unit:'quarter',amount:4}]).chafers,2);
});

test('44-eater Meatfest quantity recommendations reflect 7.0 empirical leftovers',()=>{
  const expected={cucumber:1,broccoli:1,coleslaw:1,collards:1,corn:2,mac:2,cauliflowerMac:1,beans:2,sauerkraut:1};
  for(const [id,n] of Object.entries(expected)) assert.equal(B.sideQuantity(id,44).amount,n,id);
});

test('table planning uses standard six-foot and four-foot table building blocks',()=>{
  const plan=B.tableRequirement([{items:[{id:'a'}],linearIn:54},{items:[{id:'b'}],linearIn:48}],{tableLengths:[72,48]});
  assert.deepEqual(plan.tables,[72,48]); assert.equal(plan.linearRequired,102); assert.equal(plan.linearProvided,120);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../public/buffet-engine.js',import.meta.url),'utf8');
const context={globalThis:{}};vm.runInNewContext(source,context);const B=context.globalThis.BuffetEngine;

test('side quantities scale by adult-equivalent eaters using practical units',()=>{
  const q=B.sideQuantity('mac',44); assert.equal(q.unit,'full'); assert.equal(q.amount,2); assert.equal(q.serviceVessels,2);
  const q2=B.sideQuantity('sauerkraut',44); assert.equal(q2.unit,'full'); assert.equal(q2.amount,1); assert.equal(q2.serviceVessels,1);
});

test('side quantity is independent of the other sides selected',()=>{
  const ids=['cucumber','broccoli','coleslaw','collards','corn','mac','cauliflowerMac','beans','sauerkraut'];
  const first=ids.map(id=>B.sideQuantity(id,44).amount);
  const second=ids.map(id=>B.sideQuantity(id,44).amount);
  assert.deepEqual(first,second);
});

test('half quantity is a food quantity, not four quarter pans',()=>{
  const q=B.sideQuantity('cauliflowerMac',44); assert.equal(q.unit,'half'); assert.equal(q.amount,1); assert.equal(q.serviceVessels,1);
  assert.equal(B.packFoodQuantity({unit:'quarter',amount:2}).serviceVessels,2);
});

test('full chafer is one service unit and two halves share one chafer',()=>{
  assert.equal(B.chaferPacking([{unit:'full',amount:1}]).chafers,1);
  assert.equal(B.chaferPacking([{unit:'half',amount:2}]).chafers,1);
  assert.equal(B.chaferPacking([{unit:'quarter',amount:4}]).chafers,4);
});

test('half quantities from different sides can share one physical chafer',()=>{
  const groups=B.physicalPlan([
    {type:'side',id:'mac',quantity:{unit:'half',amount:1},vessel:B.VESSELS.chafer},
    {type:'side',id:'cauliflowerMac',quantity:{unit:'half',amount:1},vessel:B.VESSELS.chafer}
  ]);
  assert.equal(groups.length,1); assert.equal(groups[0].linearIn,18); assert.equal(groups[0].items.length,2);
});

test('quarter quantities remain separate physical service units',()=>{
  const groups=B.physicalPlan([{type:'side',id:'q',quantity:{unit:'quarter',amount:4},vessel:B.VESSELS.chafer}]);
  assert.equal(groups.length,4); assert.ok(groups.every(g=>g.linearIn===18));
});

test('44-eater Meatfest quantity recommendations preserve the 7.0 empirical baseline',()=>{
  const expected={cucumber:1,broccoli:1,coleslaw:1,collards:1,corn:2,mac:2,cauliflowerMac:1,beans:2,sauerkraut:1};
  for(const [id,n] of Object.entries(expected)) assert.equal(B.sideQuantity(id,44).amount,n,id);
});

test('table planning chooses the least-overage standard table combination',()=>{
  const plan=B.tableRequirement([{items:[{id:'a'}],linearIn:54},{items:[{id:'b'}],linearIn:48}],{tableLengths:[72,48]});
  assert.deepEqual(plan.tables,[72,48]); assert.equal(plan.linearRequired,102); assert.equal(plan.linearProvided,120);
});

test('dessert load changes recommendation scale without changing dessert selection',()=>{
  const light=B.dessertPlan({dessertIds:['pie'],load:'light'}); const heavy=B.dessertPlan({dessertIds:['pie'],load:'heavy'});
  assert.equal(light[0].id,'pie'); assert.equal(heavy[0].id,'pie'); assert.equal(light[0].scaleFactor,1); assert.equal(heavy[0].scaleFactor,2);
});

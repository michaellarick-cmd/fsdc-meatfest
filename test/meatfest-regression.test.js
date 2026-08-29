import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateFinishedProtein, calculateRawRequirement, roundUpPurchase, multiplier, MEATFEST_ANCHORS } from '../src/meat-engine.js';

const A={bratLinkLb:.50,chickenLb:5,pmbeRoastLb:4,ribsRackLb:2.25,pulledPorkUnitLb:8.5,brisketUnitLb:14};

test('canonical purchase assumptions remain locked',()=>{
  assert.equal(A.bratLinkLb,.5);
  assert.equal(A.chickenLb,5);
  assert.equal(A.pmbeRoastLb,4);
  assert.equal(A.ribsRackLb,2.25);
  assert.equal(A.pulledPorkUnitLb,8.5);
  assert.equal(A.brisketUnitLb,14);
});

test('protein-count no longer silently multiplies or reduces Meatfest portions',()=>{
  assert.equal(multiplier(1),1);
  assert.equal(multiplier(6),1);
});

test('48 adult-equivalent standard Meatfest anchors produce the validated finished targets',()=>{
  const ids=['chicken','pork','brats','brisket','pmbe','ribs'];
  const rows=calculateFinishedProtein({adults:48,kids:0,selected:ids,serving:1/3});
  const byId=Object.fromEntries(rows.map(r=>[r.id,r.finishedLb]));
  assert.equal(byId.brisket,9.75);
  assert.equal(byId.pmbe,9.6);
  assert.equal(byId.pork,10.2);
  assert.equal(byId.chicken,12.4);
  assert.equal(byId.ribs,7.875);
  assert.equal(byId.brats,3.6);
});

test('portion selector scales the Meatfest anchors',()=>{
  const ids=['chicken','pork','brisket'];
  const standard=calculateFinishedProtein({adults:48,kids:0,selected:ids,serving:1/3});
  const light=calculateFinishedProtein({adults:48,kids:0,selected:ids,serving:1/4});
  const generous=calculateFinishedProtein({adults:48,kids:0,selected:ids,serving:1/2});
  assert.ok(Math.abs(light[0].finishedLb-standard[0].finishedLb*.75)<1e-9);
  assert.ok(Math.abs(generous[0].finishedLb-standard[0].finishedLb*1.5)<1e-9);
});

test('raw yield and purchase-unit rounding are deterministic',()=>{
  assert.ok(Math.abs(calculateRawRequirement({finishedLb:1.6,yieldRate:.6})-2.6666666667)<1e-6);
  const p=roundUpPurchase(2.6666666667,4);
  assert.equal(p.units,1);
  assert.equal(p.purchasedLb,4);
});

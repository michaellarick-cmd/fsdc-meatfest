import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateFinishedProtein, calculateRawRequirement, roundUpPurchase, multiplier } from '../src/meat-engine.js';

const A={bratLinkLb:.50,chickenLb:5,pmbeRoastLb:4,ribsRackLb:2.25,pulledPorkUnitLb:8.5,brisketUnitLb:14};

test('canonical purchase assumptions remain locked',()=>{assert.equal(A.bratLinkLb,.5);assert.equal(A.chickenLb,5);assert.equal(A.pmbeRoastLb,4);assert.equal(A.ribsRackLb,2.25);assert.equal(A.pulledPorkUnitLb,8.5);assert.equal(A.brisketUnitLb,14)});
test('six-protein standard multiplier is the validated Meatfest model',()=>{assert.equal(multiplier(6,1/3),.14814)});
test('48 adult-equivalent six-protein Meatfest allocation uses serving behavior',()=>{const ids=['chicken','pork','brats','brisket','pmbe','ribs'];const rows=calculateFinishedProtein({adults:48,kids:0,selected:ids,serving:1/3});const by=Object.fromEntries(rows.map(r=>[r.id,r.finishedLb]));assert.ok(Math.abs(by.pmbe-3.55536)<1e-6);assert.ok(Math.abs(by.brats-1.77768)<1e-6);assert.ok(Math.abs(by.ribs-3.55536)<1e-6);});
test('raw yield and purchase-unit rounding are deterministic',()=>{assert.ok(Math.abs(calculateRawRequirement({finishedLb:3.55536,yieldRate:.6})-5.9256)<1e-6);const p=roundUpPurchase(5.9256,4);assert.equal(p.units,2);assert.equal(p.purchasedLb,8)});

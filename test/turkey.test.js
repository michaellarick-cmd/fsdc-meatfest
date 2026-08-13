import test from 'node:test';
import assert from 'node:assert/strict';
import { turkeyPurchase } from '../src/turkey-engine.js';

test('family whole turkey uses a practical small-bird unit', () => {
  assert.deepEqual(turkeyPurchase({rawRequirementLb: 3, form: 'whole'}), {units:1, purchasedLb:8});
});

test('family turkey breast can be smaller than a whole bird', () => {
  assert.deepEqual(turkeyPurchase({rawRequirementLb: 2, form: 'breast'}), {units:1, purchasedLb:3});
});

test('turkey legs are purchased individually', () => {
  assert.deepEqual(turkeyPurchase({rawRequirementLb: 2, form: 'legs'}), {units:3, purchasedLb:2.25});
});

test('meatfest whole turkey uses larger practical birds', () => {
  assert.deepEqual(turkeyPurchase({rawRequirementLb: 15, form: 'whole', mode:'meatfest'}), {units:2, purchasedLb:28});
});

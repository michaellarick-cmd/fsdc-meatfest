import test from 'node:test';
import assert from 'node:assert/strict';

// Test the exact browser engine used in production. This prevents the test
// suite from validating a separate copy of the calculation logic.
await import('../public/meat-engine.js');
const { MeatEngine } = globalThis;

const standard = 1 / 3;
const row = (key, eaters, serving = standard, choice = {}) =>
  MeatEngine.canonicalRow({ key, eaters, serving, choice });
const familyRow = (key, eaters, serving = standard, choice = {}) =>
  MeatEngine.familyRow({ key, eaters, serving, choice });

const close = (actual, expected, tolerance = 1e-9) =>
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);

test('48-eater Meatfest anchors remain exact', () => {
  const expected = {
    brisket: [19.5, 9.75, 19.5, 0],
    pmbe: [16, 9.6, 16, 0],
    pork: [17, 10.2, 17, 0],
    chicken: [20, 12.4, 20, 0],
    ribs: [10.30909090909091, 7.216363636363637, 11.25, 0.9409090909090907],
    brats: [4, 3.6, 4, 0],
  };

  for (const [key, [raw, finished, buyWeight, excess]] of Object.entries(expected)) {
    const choice = key === 'brisket' ? { id: 'packer' } : key === 'chicken' ? { unit: 'whole fryer' } : {};
    const result = row(key, 48, standard, choice);
    close(result.raw, raw);
    close(result.finished, finished);
    close(result.buyWeight, buyWeight);
    close(result.excess, excess);
  }
});

test('whole-hog model preserves the original head-and-feet-on anchors', () => {
  const at48 = row('hog', 48, standard, { headFeet: 'on' });
  const at75 = row('hog', 75, standard, { headFeet: 'on' });
  const at100 = row('hog', 100, standard, { headFeet: 'on' });

  close(at48.finished, 16);
  close(at48.raw, 40);
  assert.equal(at48.buyWeight, 40);

  close(at75.finished, 25);
  close(at75.raw, 55.55555555555556, 1e-5);
  assert.equal(at75.buyWeight, 56);

  close(at100.finished, 33.33333333333333, 1e-4);
  close(at100.raw, 66.66666666666667, 1e-4);
  assert.equal(at100.buyWeight, 67);
});

test('whole-hog calculation is based only on hanging weight, never live weight', () => {
  const result = row('hog', 48, standard, { headFeet: 'on' });
  assert.equal(result.units, 1);
  assert.equal(result.buyWeight, 40);
  assert.ok(result.raw < 100);
  assert.ok(!('liveWeight' in result));
});

test('head-and-feet-off hog target is 7% lower than the validated head-and-feet-on target', () => {
  const on = row('hog', 48, standard, { headFeet: 'on' });
  const off = row('hog', 48, standard, { headFeet: 'off' });
  close(off.finished, on.finished);
  close(off.raw, on.raw * MeatEngine.ANCHORS.wholeHogHeadFeetOffFactor);
  assert.equal(off.buyWeight, 38);
  assert.ok(off.raw < on.raw);
});

test('whole-hog portion selector scales the hanging-weight target', () => {
  const standardHog = row('hog', 48, standard, { headFeet: 'on' });
  const lightHog = row('hog', 48, 0.25, { headFeet: 'on' });
  const heartyHog = row('hog', 48, 0.5, { headFeet: 'on' });
  close(lightHog.finished, 12);
  close(heartyHog.finished, 24);
  assert.ok(lightHog.raw < standardHog.raw);
  assert.ok(heartyHog.raw > standardHog.raw);
});

test('30-eater chicken exposes the exact raw requirement before purchase rounding', () => {
  const result = row('chicken', 30, standard, { unit: 'whole fryer' });
  close(result.raw, 12.5);
  close(result.finished, 7.75);
  assert.equal(result.units, 3);
  close(result.buyWeight, 15);
  close(result.excess, 2.5);
});

test('portion selector scales Meatfest anchors', () => {
  const standardChicken = row('chicken', 48, standard, { unit: 'whole fryer' });
  const lightChicken = row('chicken', 48, 0.25, { unit: 'whole fryer' });
  const heartyChicken = row('chicken', 48, 0.5, { unit: 'whole fryer' });
  close(lightChicken.raw, standardChicken.raw * 0.75);
  close(heartyChicken.raw, standardChicken.raw * 1.5);
});

test('turkey uses explicit yield and purchase units', () => {
  const whole = row('turkey', 48, standard, { id: 'whole', unit: 'whole turkey' });
  const breast = row('turkey', 48, standard, { id: 'breast', unit: 'turkey breast' });
  const legs = row('turkey', 48, standard, { id: 'legs', unit: 'turkey leg' });

  close(whole.raw, 29.09090909090909);
  close(whole.finished, 16);
  assert.equal(whole.units, 3);
  close(whole.buyWeight, 42);

  close(breast.raw, 24.615384615384617);
  assert.equal(breast.units, 4);
  close(breast.buyWeight, 28);

  close(legs.raw, 35.55555555555556);
  assert.equal(legs.units, 48);
  close(legs.buyWeight, 36);
});

test('ribs use count-based planning and purchase-unit rounding', () => {
  const result = row('ribs', 48);
  close(result.raw, 10.30909090909091);
  close(result.finished, 7.216363636363637);
  assert.equal(result.units, 5);
  close(result.buyWeight, 11.25);
  close(result.excess, 0.9409090909090907);
});

test('brats use one half-pound link per six adult-equivalent eaters', () => {
  const result = row('brats', 48);
  close(result.raw, 4);
  close(result.finished, 3.6);
  assert.equal(result.units, 8);
  close(result.buyWeight, 4);
});

test('prime rib has a production shopping row', () => {
  const result = row('prime', 50, standard, { id: 'whole', unit: 'roast' });
  close(result.raw, 20.833333333333332);
  close(result.finished, 16.666666666666668);
  assert.equal(result.units, 5);
  assert.equal(result.buyWeight, 25);
});

test('fish, poultry cuts, brisket flat, and boneless pork have production shopping rows', () => {
  const cases = [
    ['fish', { unit: 'filet' }, .33, .76],
    ['chicken', { id: 'legq', unit: 'leg quarter' }, .59375, .42],
    ['chicken', { id: 'thigh', unit: 'thigh' }, .25, .52],
    ['brisket', { id: 'flat', unit: 'flat' }, 7, .55],
    ['pork', { id: 'boneless', unit: 'boneless shoulder' }, 8, .60],
  ];
  for (const [key, choice, unitWeight, yieldRate] of cases) {
    const result = row(key, 48, standard, choice);
    assert.ok(result, `${key} returned no row`);
    assert.ok(Number.isFinite(result.raw));
    assert.ok(Number.isFinite(result.buyWeight));
    assert.ok(result.units >= 1);
    close(result.finished, 16, 1e-8);
    close(result.raw * yieldRate, result.finished, 1e-8);
    assert.equal(result.buyWeight, result.units * unitWeight);
  }
});

test('Family mode is a separate path with a fixed 12.5% finished-meat cushion', () => {
  const meatfest = row('prime', 8, standard, { id: 'whole', unit: 'roast' });
  const family = familyRow('prime', 8, standard, { id: 'whole', unit: 'roast' });
  close(family.finished, meatfest.finished * MeatEngine.FAMILY_CUSHION);
  assert.ok(family.buyWeight >= 3);
  assert.notEqual(family.buyWeight, meatfest.buyWeight);
});

test('Family mode uses practical small-batch units for shoulder and brisket', () => {
  const pork = familyRow('pork', 8, standard, { id: 'bone', unit: 'bone-in butt' });
  const brisket = familyRow('brisket', 8, standard, { id: 'flat', unit: 'flat' });
  assert.equal(pork.units, 1);
  assert.equal(brisket.units, 1);
  assert.ok(pork.buyWeight >= 4);
  assert.ok(brisket.buyWeight >= 4);
});

test('Family mode does not alter Meatfest canonical anchors', () => {
  const standardChicken = row('chicken', 48, standard, { unit: 'whole fryer' });
  const standardAgain = row('chicken', 48, standard, { unit: 'whole fryer' });
  close(standardChicken.raw, 20);
  close(standardAgain.raw, 20);
  close(standardChicken.buyWeight, 20);
});

test('unsupported selections return no calculation row', () => {
  assert.equal(row('not-a-protein', 48), null);
  assert.equal(familyRow('not-a-protein', 48), null);
});
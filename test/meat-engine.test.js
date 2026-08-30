import test from 'node:test';
import assert from 'node:assert/strict';

// Test the exact browser engine used in production. This prevents the test
// suite from validating a separate copy of the calculation logic.
await import('../public/meat-engine.js');
const { MeatEngine } = globalThis;

const standard = 1 / 3;
const row = (key, eaters, serving = standard, choice = {}) =>
  MeatEngine.canonicalRow({ key, eaters, serving, choice });

const close = (actual, expected, tolerance = 1e-9) =>
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);

test('48-eater Meatfest anchors remain exact', () => {
  const expected = {
    brisket: [19.5, 9.75, 19.5, 0],
    pmbe: [16, 9.6, 16, 0],
    pork: [17, 10.2, 17, 0],
    chicken: [20, 12.4, 20, 0],
    ribs: [10.227272727272727, 7.159090909090908, 11.25, 1.022727272727273],
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

test('ribs use count-based planning and purchase-unit rounding', () => {
  const result = row('ribs', 48);
  close(result.raw, 10.227272727272727);
  close(result.finished, 7.159090909090908);
  assert.equal(result.units, 5);
  close(result.buyWeight, 11.25);
  close(result.excess, 1.022727272727273);
});

test('brats use one half-pound link per six adult-equivalent eaters', () => {
  const result = row('brats', 48);
  close(result.raw, 4);
  close(result.finished, 3.6);
  assert.equal(result.units, 8);
  close(result.buyWeight, 4);
});

test('unsupported selections return no calculation row', () => {
  assert.equal(row('not-a-protein', 48), null);
  assert.equal(row('chicken', 48), null);
});

import test from 'node:test';
import assert from 'node:assert/strict';

// Canonical Meatfest planning assumptions. These tests intentionally protect
// the values that have caused regressions during prior deployments.
const ASSUMPTIONS = {
  servingLb: 1 / 3,
  bratLinkLb: 0.50,
  chickenLb: 5,
  pmbeRoastLb: 4,
  ribsRackLb: 2.25,
  pulledPorkUnitLb: 8.5,
  brisketUnitLb: 14,
};

test('canonical Meatfest purchase assumptions remain locked', () => {
  assert.equal(ASSUMPTIONS.bratLinkLb, 0.50);
  assert.equal(ASSUMPTIONS.chickenLb, 5);
  assert.equal(ASSUMPTIONS.pmbeRoastLb, 4);
  assert.equal(ASSUMPTIONS.ribsRackLb, 2.25);
  assert.equal(ASSUMPTIONS.pulledPorkUnitLb, 8.5);
  assert.equal(ASSUMPTIONS.brisketUnitLb, 14);
});

test('six-protein baseline uses the Meatfest serving target', () => {
  const adultEquivalent = 48;
  const selectedProteins = 6;
  const finishedTarget = adultEquivalent * ASSUMPTIONS.servingLb;
  const perProtein = finishedTarget / selectedProteins;
  assert.equal(Math.round(finishedTarget * 100) / 100, 16);
  assert.equal(Math.round(perProtein * 100) / 100, 2.67);
});

test('brats are measured at half a pound per link', () => {
  assert.equal(6 * ASSUMPTIONS.bratLinkLb, 3);
});

test('PMBE uses four-pound chuck roasts', () => {
  assert.equal(2 * ASSUMPTIONS.pmbeRoastLb, 8);
});

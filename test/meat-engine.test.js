import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateFamilyFinishedProtein,
  calculateFinishedProtein,
  calculateRawRequirement,
  roundUpPurchase,
} from '../src/meat-engine.js';

const total = (rows) => rows.reduce((sum, row) => sum + row.finishedLb, 0);

test('Family: 5-person standard portion is about 1/3 lb total finished meat', () => {
  const rows = calculateFamilyFinishedProtein({ adults: 4, kids: 1, selected: ['pork', 'ribs'], serving: 1 / 3 });
  assert.equal(rows.length, 2);
  assert.ok(Math.abs(total(rows) - (4.5 / 3)) < 0.002);
  assert.ok(rows.every((row) => row.finishedLb > 0));
});

test('Family: changing the number of proteins does not increase total planned meat', () => {
  const two = calculateFamilyFinishedProtein({ adults: 5, kids: 0, selected: ['pork', 'ribs'], serving: 1 / 3 });
  const three = calculateFamilyFinishedProtein({ adults: 5, kids: 0, selected: ['pork', 'ribs', 'brisket'], serving: 1 / 3 });
  assert.ok(Math.abs(total(two) - 5 / 3) < 0.002);
  assert.ok(Math.abs(total(three) - 5 / 3) < 0.004);
});

test('Family: portion choices are total finished meat per person', () => {
  const light = calculateFamilyFinishedProtein({ adults: 5, selected: ['pork', 'brisket'], serving: 0.25 });
  const standard = calculateFamilyFinishedProtein({ adults: 5, selected: ['pork', 'brisket'], serving: 1 / 3 });
  const hearty = calculateFamilyFinishedProtein({ adults: 5, selected: ['pork', 'brisket'], serving: 0.5 });
  assert.ok(total(light) < total(standard));
  assert.ok(total(standard) < total(hearty));
  assert.ok(Math.abs(total(light) - 1.25) < 0.002);
  assert.ok(Math.abs(total(hearty) - 2.5) < 0.002);
});

test('Family: children retain existing half-eater handling', () => {
  const rows = calculateFamilyFinishedProtein({ adults: 4, kids: 2, selected: ['pork'], serving: 1 / 3 });
  assert.ok(Math.abs(total(rows) - (5 / 3)) < 0.002);
});

test('Family: no hidden 12.5% meat cushion', () => {
  const rows = calculateFamilyFinishedProtein({ adults: 5, selected: ['pork'], serving: 1 / 3 });
  assert.ok(Math.abs(total(rows) - (5 / 3)) < 0.002);
});

test('Meatfest: six-protein standard anchors are not equal-share math', () => {
  const rows = calculateFinishedProtein({ adults: 48, selected: ['chicken', 'pork', 'brats', 'brisket', 'pmbe', 'ribs'], serving: 1 / 3 });
  assert.equal(rows.length, 6);
  const byId = Object.fromEntries(rows.map((row) => [row.id, row.finishedLb]));
  assert.equal(byId.brisket, 9.75);
  assert.equal(byId.pmbe, 9.6);
  assert.equal(byId.pork, 10.2);
  assert.equal(byId.chicken, 12.4);
  assert.ok(Math.abs(byId.ribs - 7.875) < 1e-12);
  assert.equal(byId.brats, 3.6);
});

test('Meatfest: serving-unit conversions retain the established taker rules', () => {
  const rows = calculateFinishedProtein({ adults: 48, selected: ['ribs', 'brats'], serving: 1 / 3 });
  const ribs = rows.find((row) => row.id === 'ribs');
  const brats = rows.find((row) => row.id === 'brats');
  assert.ok(Math.abs(ribs.servingUnits.takers - 28.8) < 0.001);
  assert.ok(Math.abs(ribs.servingUnits.units - 50.4) < 0.001);
  assert.ok(Math.abs(brats.servingUnits.units - 100.8) < 0.001);
});

test('Meatfest: portion selector scales anchors', () => {
  const standard = calculateFinishedProtein({ adults: 48, selected: ['chicken'], serving: 1 / 3 });
  const light = calculateFinishedProtein({ adults: 48, selected: ['chicken'], serving: 0.25 });
  const generous = calculateFinishedProtein({ adults: 48, selected: ['chicken'], serving: 0.5 });
  assert.ok(Math.abs(light[0].finishedLb - standard[0].finishedLb * 0.75) < 1e-9);
  assert.ok(Math.abs(generous[0].finishedLb - standard[0].finishedLb * 1.5) < 1e-9);
});

test('Raw requirement converts finished meat using protein yield', () => {
  assert.ok(Math.abs(calculateRawRequirement({ finishedLb: 1, yieldRate: 0.6 }) - (1 / 0.6)) < 1e-12);
});

test('Purchase quantities round up and expose planned leftover', () => {
  const result = roundUpPurchase(4.2, 2.25);
  assert.equal(result.units, 2);
  assert.equal(result.purchasedLb, 4.5);
  assert.ok(Math.abs(result.leftoverLb - 0.3) < 1e-12);
});

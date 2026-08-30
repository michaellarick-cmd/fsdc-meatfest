import test from 'node:test';
import assert from 'node:assert/strict';

await import('../public/meat-engine.js');
const { MeatEngine } = globalThis;
const standard = 1 / 3;

const choices = {
  brisket: { id: 'packer' },
  pmbe: { id: 'chuck' },
  ribs: {},
  pork: { id: 'bone' },
  brats: {},
  chicken: { unit: 'whole fryer' },
};

test('multi-protein planning scales each established Meatfest anchor to headcount', () => {
  const rows = MeatEngine.multiProteinRows({ keys: Object.keys(choices), eaters: 44, serving: standard, choices });
  assert.equal(rows.length, 6);

  const byKey = Object.fromEntries(rows.map(row => [row.key, row]));
  assert.equal(byKey.brisket.buyWeight, 17.875);
  assert.equal(byKey.pmbe.buyWeight, 16);
  assert.equal(byKey.ribs.buyWeight, 11.25);
  assert.equal(byKey.pork.buyWeight, 17);
  assert.equal(byKey.brats.buyWeight, 4);
  assert.equal(byKey.chicken.buyWeight, 20);

  const purchase = rows.reduce((sum, row) => sum + row.buyWeight, 0);
  assert.ok(Math.abs(purchase - 86.125) < 1e-9);
});

test('multi-protein rows preserve the canonical 48-eater anchors', () => {
  const rows = MeatEngine.multiProteinRows({ keys: Object.keys(choices), eaters: 48, serving: standard, choices });
  const byKey = Object.fromEntries(rows.map(row => [row.key, row]));

  assert.equal(byKey.brisket.buyWeight, 19.5);
  assert.equal(byKey.pmbe.buyWeight, 16);
  assert.equal(byKey.ribs.buyWeight, 11.25);
  assert.equal(byKey.pork.buyWeight, 17);
  assert.equal(byKey.brats.buyWeight, 4);
  assert.equal(byKey.chicken.buyWeight, 20);
});

test('whole hog remains an exclusive feature-protein path', () => {
  const rows = MeatEngine.multiProteinRows({
    keys: ['hog', 'chicken'],
    eaters: 44,
    serving: standard,
    choices: { hog: { headFeet: 'on' }, chicken: { unit: 'whole fryer' } }
  });
  assert.deepEqual(rows, []);
});

test('a single selected protein keeps its canonical Meatfest anchor scaling', () => {
  const rows = MeatEngine.multiProteinRows({
    keys: ['chicken'],
    eaters: 44,
    serving: standard,
    choices: { chicken: { unit: 'whole fryer' } }
  });
  assert.equal(rows.length, 1);
  assert.ok(Math.abs(rows[0].finished - (44 / 48) * 12.4) < 1e-9);
  assert.equal(rows[0].buyWeight, 20);
});

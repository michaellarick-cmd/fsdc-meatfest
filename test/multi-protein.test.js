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

test('multi-protein planning allocates one overall finished-meat target', () => {
  const rows = MeatEngine.multiProteinRows({
    keys: Object.keys(choices),
    eaters: 44,
    serving: standard,
    choices,
  });

  assert.equal(rows.length, 6);
  const finished = rows.reduce((sum, row) => sum + row.finished, 0);
  const purchase = rows.reduce((sum, row) => sum + row.buyWeight, 0);
  assert.ok(Math.abs(finished - (44 / 3)) < 1e-9);
  assert.ok(purchase < 86.2, `purchase weight ${purchase} should be below the prior additive-anchor result`);
  assert.ok(purchase > finished, 'purchase weight must still include practical purchase-unit rounding');
});

test('multi-protein role shares preserve the canonical anchor proportions', () => {
  const keys = ['brisket', 'pmbe', 'ribs', 'pork', 'brats', 'chicken'];
  const rows = MeatEngine.multiProteinRows({ keys, eaters: 48, serving: standard, choices });
  const roleTotal = rows.reduce((sum, row) => sum + row.roleShare, 0);
  assert.ok(Math.abs(roleTotal - 1) < 1e-12);
  for (const row of rows) assert.ok(row.roleShare > 0);
});

test('whole hog remains an exclusive feature-protein path', () => {
  const rows = MeatEngine.multiProteinRows({
    keys: ['hog', 'chicken'],
    eaters: 44,
    serving: standard,
    choices: { hog: { headFeet: 'on' }, chicken: { unit: 'whole fryer' } },
  });
  assert.deepEqual(rows, []);
});

test('a single selected protein still receives the full overall meat target', () => {
  const rows = MeatEngine.multiProteinRows({
    keys: ['chicken'],
    eaters: 44,
    serving: standard,
    choices: { chicken: { unit: 'whole fryer' } },
  });
  assert.equal(rows.length, 1);
  assert.ok(Math.abs(rows[0].finished - (44 / 3)) < 1e-9);
  assert.equal(rows[0].buyWeight, 20);
});

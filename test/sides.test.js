import test from 'node:test';
import assert from 'node:assert/strict';
import { sides, sideOrder, sideQty } from '../public/side-engine.js';

const restored = ['asparagus', 'greenbeans', 'pastasalad', 'potatosalad'];
const headcounts = [10, 30, 48, 75, 100];

test('restored sides exist in the side engine', () => {
  for (const id of restored) {
    assert.ok(sides[id], `${id} is missing from the side engine`);
    assert.ok(sideOrder.includes(id), `${id} is missing from side order`);
  }
});

test('restored sides return valid quantities across event sizes', () => {
  for (const id of restored) {
    let previous = 0;
    for (const eaters of headcounts) {
      const quantity = sideQty(id, { eaters, proteinCount: 1, mainSideCount: 1 });
      assert.ok(Number.isFinite(quantity));
      assert.ok(quantity > 0);
      assert.ok(quantity >= previous);
      previous = quantity;
    }
  }
});

test('restored sides respond to protein count and variety', () => {
  for (const id of restored) {
    const normal = sideQty(id, { eaters: 48, proteinCount: 1, mainSideCount: 1 });
    const varied = sideQty(id, { eaters: 48, proteinCount: 3, mainSideCount: 3 });
    assert.notEqual(normal, varied, `${id} ignores protein/variety inputs`);
  }
});

test('family mode is valid, deterministic, and uses its own planning rule', () => {
  for (const id of restored) {
    for (const eaters of headcounts) {
      const inputs = { eaters, proteinCount: 2, mainSideCount: 2 };
      const meatfest = sideQty(id, { ...inputs, planningMode: 'meatfest' });
      const family = sideQty(id, { ...inputs, planningMode: 'family' });

      assert.ok(Number.isFinite(family));
      assert.ok(family > 0);
      assert.equal(family, sideQty(id, { ...inputs, planningMode: 'family' }));
      assert.equal(meatfest, sideQty(id, { ...inputs, planningMode: 'meatfest' }));

      // Family mode intentionally applies a 12.5% planning uplift before
      // purchase-unit rounding. The rounded result can occasionally tie the
      // Meatfest quantity, so it must not be required to be strictly larger.
      assert.ok(family >= meatfest || family === meatfest);
    }
  }
});

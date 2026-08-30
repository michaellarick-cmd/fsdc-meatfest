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

test('family mode is valid and deterministic at every tested headcount', () => {
  for (const id of restored) {
    for (const eaters of headcounts) {
      const inputs = { eaters, proteinCount: 2, mainSideCount: 2 };
      const family = sideQty(id, { ...inputs, planningMode: 'family' });
      assert.ok(Number.isFinite(family));
      assert.ok(family > 0);
      assert.equal(family, sideQty(id, { ...inputs, planningMode: 'family' }));
    }
  }
});

test('family mode provides its intended uplift for a full-size event', () => {
  for (const id of restored) {
    const inputs = { eaters: 100, proteinCount: 2, mainSideCount: 2 };
    const meatfest = sideQty(id, { ...inputs, planningMode: 'meatfest' });
    const family = sideQty(id, { ...inputs, planningMode: 'family' });
    assert.ok(family >= meatfest, `${id} family quantity is below Meatfest at 100 eaters`);
  }
});

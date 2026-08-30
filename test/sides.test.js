import test from 'node:test';
import assert from 'node:assert/strict';
import { sides, sideOrder, sideQty } from '../public/side-engine.js';

const restored = ['asparagus', 'greenbeans', 'pastasalad', 'potatosalad'];
const headcounts = [10, 30, 48, 75, 100];

test('restored sides exist in the side engine', () => {
  for (const id of restored) {
    assert.ok(sides[id]);
    assert.ok(sideOrder.includes(id));
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
    assert.notEqual(normal, varied);
  }
});

test('family planning is deterministic and not below Meatfest planning', () => {
  for (const id of restored) {
    for (const eaters of headcounts) {
      const meatfest = sideQty(id, { eaters, proteinCount: 2, mainSideCount: 2, planningMode: 'meatfest' });
      const family = sideQty(id, { eaters, proteinCount: 2, mainSideCount: 2, planningMode: 'family' });
      assert.equal(meatfest, sideQty(id, { eaters, proteinCount: 2, mainSideCount: 2, planningMode: 'meatfest' }));
      assert.equal(family, sideQty(id, { eaters, proteinCount: 2, mainSideCount: 2, planningMode: 'family' }));
      assert.ok(family >= meatfest);
    }
  }
});

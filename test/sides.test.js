import test from 'node:test';
import assert from 'node:assert/strict';

// Load the production side planner exactly as the browser does.
await import('../public/app.js');

const { sideQty, sides } = globalThis;
assert.equal(typeof sideQty, 'function');
assert.ok(sides && typeof sides === 'object');

const expectedSides = ['Asparagus', 'Green Beans', 'Pasta Salad', 'Potato Salad'];

for (const name of expectedSides) {
  test(`${name} exists and scales across event sizes`, () => {
    assert.ok(sides[name], `${name} is missing from production side catalog`);
    const quantities = [10, 30, 48, 75, 100].map(eaters => sideQty(name, eaters));
    for (const quantity of quantities) {
      assert.equal(typeof quantity, 'number', `${name} did not return a numeric quantity`);
      assert.ok(Number.isFinite(quantity), `${name} returned a non-finite quantity`);
      assert.ok(quantity > 0, `${name} returned a non-positive quantity`);
    }
  });
}

test('all four restored sides are independently calculable', () => {
  for (const name of expectedSides) {
    const small = sideQty(name, 10);
    const large = sideQty(name, 100);
    assert.ok(large >= small, `${name} decreased as guest count increased`);
  }
});

test('side quantities are deterministic', () => {
  for (const name of expectedSides) {
    for (const eaters of [10, 30, 48, 75, 100]) {
      assert.equal(sideQty(name, eaters), sideQty(name, eaters), `${name} is not deterministic`);
    }
  }
});

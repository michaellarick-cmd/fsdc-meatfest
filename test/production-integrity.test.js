import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const worker = await readFile(new URL('../worker.js', import.meta.url), 'utf8');
const app = await readFile(new URL('../public/app.js', import.meta.url), 'utf8');
const engine = await readFile(new URL('../public/meat-engine.js', import.meta.url), 'utf8');
const presentation = await readFile(new URL('../public/meatfest-final.js', import.meta.url), 'utf8');

test('worker only forwards static assets', () => {
  assert.doesNotMatch(worker, /replace\(/);
  assert.doesNotMatch(worker, /await response\.text\(\)/);
  assert.doesNotMatch(worker, /MutationObserver/);
  assert.match(worker, /env\.ASSETS\.fetch\(request\)/);
});

test('production presentation contains restored sides and turkey', () => {
  for (const term of ['Green Beans', 'Potato Salad', 'Asparagus', 'Pasta Salad', 'Turkey']) {
    assert.ok(presentation.includes(term), `${term} is missing from production presentation code`);
  }
  assert.match(presentation, /sideRecommendation = function/);
  assert.match(presentation, /prime_rib/);
});

test('production presentation renders the meat shopping list', () => {
  assert.match(presentation, /const resultsBox = \$\("results"\)/);
  assert.match(presentation, /resultsBox\.innerHTML = rows\.length/);
  assert.match(presentation, /row\.buyWeight/);
  assert.match(presentation, /row\.raw/);
  assert.match(presentation, /row\.finished/);
});

test('Family mode uses the isolated engine path', () => {
  assert.match(engine, /function familyRow\(/);
  assert.match(engine, /FAMILY_CUSHION/);
  assert.match(presentation, /planningMode === "family" \? MeatEngine\.familyRow : MeatEngine\.canonicalRow/);
});

test('UI metadata agrees with the canonical whole-chicken purchase anchor', () => {
  assert.match(app, /whole:\{label:"Whole Fryer — Pulled",yield:\.62,unitWeight:5,/);
  assert.doesNotMatch(app, /unitWeight:4\.5/);
});

test('duplicate production calculation helpers are absent from the UI layer', () => {
  assert.doesNotMatch(app, /function wholeHogYield\(/);
  assert.doesNotMatch(app, /function wholeHogPlan\(/);
  assert.doesNotMatch(app, /function familyPurchase\(/);
  assert.doesNotMatch(app, /function purchaseDisplay\(/);
});

test('no runtime patch markers remain in production presentation code', () => {
  assert.doesNotMatch(presentation, /FSDC-NEW-SIDES-INTEGRATED/);
  assert.doesNotMatch(presentation, /FSDC-TURKEY-INTEGRATED/);
  assert.doesNotMatch(presentation, /FSDC-SIDE-RECOMMENDATIONS-V2/);
});
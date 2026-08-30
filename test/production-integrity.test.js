import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const worker = await readFile(new URL('../worker.js', import.meta.url), 'utf8');
const index = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const app = await readFile(new URL('../public/app.js', import.meta.url), 'utf8');
const engine = await readFile(new URL('../public/meat-engine.js', import.meta.url), 'utf8');
const presentation = await readFile(new URL('../public/meatfest-final.js', import.meta.url), 'utf8');

test('worker only forwards static assets', () => {
  assert.doesNotMatch(worker, /replace\(/);
  assert.doesNotMatch(worker, /await response\.text\(\)/);
  assert.doesNotMatch(worker, /MutationObserver/);
  assert.match(worker, /env\.ASSETS\.fetch\(request\)/);
});

test('production UI contains the canonical side catalog and restored proteins', () => {
  for (const term of ['Green Beans', 'Potato Salad', 'Asparagus', 'Pasta Salad', 'Turkey', 'Pork Belly Burnt Ends']) {
    assert.ok(app.includes(term), `${term} is missing from app.js`);
  }
  assert.match(app, /sideRecommendationMatrix/);
  assert.match(app, /sideOrder=\["asparagus","beans","broccoli","cauli","slaw","collards","corn","cucumber","greenbeans","mac","pastasalad","potatosalad","kraut","cornbread","rolls"\]/);
});

test('protein order is canonical for both selection and shopping-list output', () => {
  assert.match(app, /const order=\["brisket","pmbe","ribs","pork","pbbe","brats","chicken","turkey","fish","prime","hog"\]/);
  assert.match(app, /const visibleOrder=planningMode==="family"\?order\.filter/);
  assert.match(presentation, /const orderedSelectedRows=eaters=>order\.map\(key=>selected\.has\(key\)\?rowFor\(key,eaters\):null\)\.filter\(Boolean\)/);
  assert.match(presentation, /rows=orderedSelectedRows\(t\.eaters\)/);
});

test('shopping-list ordering only includes selected proteins', () => {
  assert.match(presentation, /selected\.has\(key\)\?rowFor\(key,eaters\):null/);
  assert.doesNotMatch(presentation, /order\.map\(key=>rowFor\(key,eaters\)/);
  assert.match(app, /selected=new Set\(x\.selected\|\|\[\]\)/);
});

test('production presentation renders the meat shopping list', () => {
  assert.match(presentation, /const resultsBox=\$\("results"\)/);
  assert.match(presentation, /resultsBox\.innerHTML=rows\.length/);
  assert.match(presentation, /row\.buyWeight/);
  assert.match(presentation, /row\.raw/);
  assert.match(presentation, /row\.finished/);
});

test('Family mode uses the isolated engine path', () => {
  assert.match(engine, /function familyRow\(/);
  assert.match(engine, /FAMILY_CUSHION/);
  assert.match(presentation, /planningMode==="family"\?MeatEngine\.familyRow:MeatEngine\.canonicalRow/);
});

test('Pork Belly Burnt Ends has a canonical engine path', () => {
  assert.match(engine, /pbbeYield/);
  assert.match(engine, /pbbeLb/);
  assert.match(engine, /key === 'pbbe'/);
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

test('reset fields use placeholders instead of real zero/default values', () => {
  assert.match(index, /id="eventName"[^>]*placeholder="Your Event"/);
  assert.doesNotMatch(index, /id="eventName"[^>]*value="Your Event"/);
  assert.match(index, /id="adults"[^>]*placeholder="0"/);
  assert.match(index, /id="kids"[^>]*placeholder="0"/);
  assert.doesNotMatch(index, /id="adults"[^>]*value="0"/);
  assert.doesNotMatch(index, /id="kids"[^>]*value="0"/);
});

test('saved zero defaults are normalized without depending on quote style or formatting', () => {
  assert.match(app, /value\s*===\s*["']0["']\s*\?\s*["']["']\s*:\s*value/);
});

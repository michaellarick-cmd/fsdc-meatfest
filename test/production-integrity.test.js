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
  assert.match(presentation, /const keys=order\.filter\(key=>selected\.has\(key\)\)/);
  assert.match(presentation, /const planned=MeatEngine\.multiProteinRows\(\{keys,eaters,serving:portion\(\),choices:choiceMap\}\)/);
  assert.match(presentation, /const rows=selectedRows\(t\.eaters\)/);
});

test('shopping-list ordering only includes selected proteins', () => {
  assert.match(presentation, /const keys=order\.filter\(key=>selected\.has\(key\)\)/);
  assert.doesNotMatch(presentation, /order\.map\(key=>rowFor\(key,eaters\)/);
  assert.match(app, /selected=new Set\(x\.selected\|\|\[\]\)/);
});

test('production presentation renders the meat shopping list', () => {
  assert.match(presentation, /const rows=selectedRows\(t\.eaters\)/);
  assert.match(presentation, /\$\("results"\)\.innerHTML=rows\.length/);
  assert.match(presentation, /row\.buyWeight/);
  assert.match(presentation, /row\.raw/);
  assert.match(presentation, /row\.finished/);
});

test('all purchase-weight totals use purchase-weight wording', () => {
  assert.match(index, /<div class="small">TOTAL PURCHASE WEIGHT<\/div>/);
  assert.match(index, /<span class="ps-totalLabel">TOTAL PURCHASE WEIGHT<\/span>/);
  assert.doesNotMatch(index, /TOTAL RAW MEAT TO BUY/);
  assert.doesNotMatch(index, /TOTAL RAW MEAT<\/span>/);
  assert.match(presentation, /const totalLabel=document\.querySelector\("\.hero \.small"\)/);
  assert.match(presentation, /totalLabel\.textContent="TOTAL PURCHASE WEIGHT"/);
  assert.match(presentation, /\$\("totalRaw"\)\.textContent=total\?/);
});

test('Family mode uses the isolated engine path', () => {
  assert.match(engine, /function familyRow\(/);
  assert.match(engine, /FAMILY_CUSHION/);
  assert.match(presentation, /planningMode==="family"\)return keys\.map/);
  assert.match(presentation, /MeatEngine\.familyRow\(\{key,eaters,serving:portion\(\),choice:/);
  assert.match(presentation, /MeatEngine\.multiProteinRows\(\{keys,eaters,serving:portion\(\),choices:/);
});

test('Pork Belly Burnt Ends has a canonical engine path', () => {
  assert.match(engine, /pbbeYield/);
  assert.match(engine, /pbbeLb/);
  assert.match(engine, /key==='pbbe'/);
});

test('UI metadata agrees with the canonical whole-chicken purchase anchor', () => {
  assert.match(app, /whole:\{label:"Whole Fryer — Pulled",yield:\.62,unitWeight:5,/);
  assert.doesNotMatch(app, /unitWeight:4\.5/);
});

test('presentation layer does not override shared protein or side metadata', () => {
  assert.doesNotMatch(presentation, /Object\.assign\(sides/);
  assert.doesNotMatch(presentation, /meats\.turkey\s*=/);
  assert.doesNotMatch(presentation, /meats\.pbbe\s*=/);
  assert.doesNotMatch(presentation, /sideRecommendation\s*=.*switch/);
  assert.doesNotMatch(presentation, /sideOrder\.splice/);
  assert.doesNotMatch(presentation, /order\.splice/);
});

test('calculation engine remains the only source of canonical protein math', () => {
  assert.doesNotMatch(app, /function wholeHogYield\(/);
  assert.doesNotMatch(app, /function wholeHogPlan\(/);
  assert.doesNotMatch(app, /function familyPurchase\(/);
  assert.doesNotMatch(app, /function purchaseDisplay\(/);
  assert.match(presentation, /MeatEngine\.canonicalRow/);
  assert.match(presentation, /MeatEngine\.familyRow/);
  assert.match(presentation, /MeatEngine\.multiProteinRows/);
});

test('reset fields use placeholders instead of real zero/default values', () => {
  assert.match(index, /id="eventName"[^>]*placeholder="Your Event"/);
  assert.doesNotMatch(index, /id="eventName"[^>]*value="Your Event"/);
  assert.match(index, /id="adults"[^>]*placeholder="0"/);
  assert.match(index, /id="kids"[^>]*placeholder="0"/);
  assert.doesNotMatch(index, /id="adults"[^>]*value="0"/);
  assert.doesNotMatch(index, /id="kids"[^>]*value="0"/);
});

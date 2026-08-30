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

test('production presentation contains the canonical side list and selectable proteins', () => {
  for (const term of ['Green Beans', 'Potato Salad', 'Asparagus', 'Pasta Salad', 'Turkey', 'Pork Belly Burnt Ends']) {
    assert.ok(presentation.includes(term), `${term} is missing from production presentation code`);
  }
  assert.match(presentation, /sideRecommendation = function/);
  assert.match(presentation, /pork_belly_burnt_ends/);
});

test('main sides are alphabetized and accompaniments remain separate', () => {
  assert.match(presentation, /sideOrder\.splice\(0,sideOrder\.length,"asparagus","beans","broccoli","cauli","slaw","collards","corn","cucumber","greenbeans","mac","pastasalad","potatosalad","kraut","cornbread","rolls"\)/);
  assert.match(presentation, /cornbread:\{name:"Cornbread"/);
  assert.match(presentation, /rolls:\{name:"Hawaiian Rolls"/);
});

test('side recommendation matrix matches the supplied Meatfest grid', () => {
  const expected = [
    ['asparagus', 'fish', 'prime_rib'],
    ['beans', 'chicken_pulled', 'chicken_quarters', 'chicken_thighs', 'fish', 'pulled_pork', 'whole_hog', 'brisket', 'pmbe', 'ribs', 'pork_belly_burnt_ends'],
    ['broccoli'],
    ['cauli', 'chicken_pulled', 'chicken_quarters', 'chicken_thighs', 'pulled_pork', 'brisket', 'pmbe', 'turkey', 'pork_belly_burnt_ends'],
    ['slaw', 'chicken_pulled', 'chicken_quarters', 'chicken_thighs', 'fish', 'pulled_pork', 'whole_hog', 'pmbe', 'ribs', 'turkey', 'pork_belly_burnt_ends'],
    ['collards', 'whole_hog'],
    ['corn', 'chicken_pulled', 'chicken_quarters', 'chicken_thighs', 'pmbe', 'ribs'],
    ['cucumber', 'chicken_pulled', 'chicken_quarters', 'chicken_thighs', 'fish', 'brisket', 'pmbe', 'ribs', 'pork_belly_burnt_ends'],
    ['greenbeans', 'chicken_pulled', 'chicken_quarters', 'chicken_thighs', 'fish', 'brisket', 'prime_rib', 'ribs', 'turkey'],
    ['kraut', 'brats'],
    ['mac', 'chicken_pulled', 'chicken_quarters', 'chicken_thighs', 'pulled_pork', 'brisket', 'pmbe', 'turkey', 'pork_belly_burnt_ends'],
    ['pastasalad', 'prime_rib'],
    ['potatosalad', 'chicken_pulled', 'chicken_quarters', 'chicken_thighs', 'whole_hog', 'brisket', 'pmbe', 'ribs', 'turkey', 'pork_belly_burnt_ends'],
    ['cornbread', 'chicken_pulled', 'chicken_quarters', 'chicken_thighs', 'brisket', 'pmbe', 'ribs', 'turkey'],
    ['rolls', 'pulled_pork', 'whole_hog', 'prime_rib', 'ribs', 'turkey']
  ];
  for (const [side, ...tags] of expected) {
    const body = presentation.match(new RegExp(`case "${side}":return ([^;]+);`))?.[1] || '';
    for (const tag of tags) assert.match(body, new RegExp(`"${tag}"`), `${side} is missing ${tag}`);
    if (!tags.length) assert.equal(body, 'false', `${side} should have no recommendations`);
  }
});

test('Pork Belly Burnt Ends has canonical yield and purchase-unit math', () => {
  assert.match(engine, /pbbeYield:\.65/);
  assert.match(engine, /pbbeLb:5/);
  assert.match(engine, /key === 'pbbe'/);
  assert.match(presentation, /pbbe:\{name:"Pork Belly Burnt Ends"/);
  assert.match(presentation, /key==="pbbe"/);
});

test('multiple proteins use OR recommendation semantics', () => {
  assert.match(presentation, /selected\.forEach\(key=>/);
  assert.match(presentation, /const any=tags=>tags\.some\(tag=>active\.has\(tag\))/);
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
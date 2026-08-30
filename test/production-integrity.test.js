import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const worker = await readFile(new URL('../worker.js', import.meta.url), 'utf8');
const presentation = await readFile(new URL('../public/meatfest-final.js', import.meta.url), 'utf8');
const tree = JSON.parse(await readFile(new URL('../.github/workflows/test.yml', import.meta.url), 'utf8').catch(() => 'null'));

test('worker only forwards static assets', () => {
  assert.doesNotMatch(worker, /replace\(/);
  assert.doesNotMatch(worker, /await response\.text\(\)/);
  assert.doesNotMatch(worker, /MutationObserver/);
  assert.match(worker, /env\.ASSETS\.fetch\(request\)/);
});

test('production presentation contains restored sides and turkey', () => {
  for (const term of ['Green Beans', 'Potato Salad', 'Asparagus', 'Pasta Salad', 'Turkey']) {
    assert.match(presentation, new RegExp(term.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')));
  }
  assert.match(presentation, /sideRecommendation = function/);
  assert.match(presentation, /prime_rib/);
});

test('no runtime patch markers remain in production presentation code', () => {
  assert.doesNotMatch(presentation, /FSDC-NEW-SIDES-INTEGRATED/);
  assert.doesNotMatch(presentation, /FSDC-TURKEY-INTEGRATED/);
  assert.doesNotMatch(presentation, /FSDC-SIDE-RECOMMENDATIONS-V2/);
});

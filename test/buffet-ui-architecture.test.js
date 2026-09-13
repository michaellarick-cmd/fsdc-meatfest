import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const entry=await readFile(new URL('../public/buffet-ui.js',import.meta.url),'utf8');
const app=await readFile(new URL('../public/buffet-app.js',import.meta.url),'utf8');
const worker=await readFile(new URL('../public/buffet-worker.js',import.meta.url),'utf8');
const headers=await readFile(new URL('../public/_headers',import.meta.url),'utf8');

test('Buffet is a self-contained application component',()=>{
  assert.match(entry,/buffet-app\.js\?v=3/);
  assert.match(entry,/meatfest-buffet/);
  assert.match(entry,/insertBefore\(document\.createElement\('meatfest-buffet'\),footer\)/);
  assert.doesNotMatch(entry,/IntersectionObserver|rootMargin|scrollTo\(|scrollBy\(/);
  assert.match(app,/customElements\.define\('meatfest-buffet'/);
  assert.match(app,/attachShadow\(\{mode:'open'\}\)/);
  assert.match(app,/const STORAGE_KEY='mfBuffet18'/);
  assert.match(app,/new Worker\('\/buffet-worker\.js\?v=3'\)/);
  assert.match(app,/window\.buildSummary\(\)/);
  assert.match(app,/setCoreBread/);
  assert.doesNotMatch(app,/addEventListener\('scroll'/);
  assert.doesNotMatch(app,/IntersectionObserver|MutationObserver|scrollTo\(|scrollBy\(/);
  assert.doesNotMatch(app,/\.innerHTML\s*=/);
});

test('Buffet has one state-to-view pipeline and persistent section owners',()=>{
  for(const name of ['supplemental','bread','sausage','condiments','desserts','service','layout'])assert.match(app,new RegExp(`'${name}'`));
  assert.match(app,/this\.state=/);
  assert.match(app,/this\.input\(\)/);
  assert.match(app,/this\.requestPlan\(\)/);
  assert.match(app,/this\.renderResult\(message\.result\)/);
  assert.match(app,/this\.refs\.rows=new Map/);
  assert.match(app,/this\.refs\.layout=\{section:layout,rows:tableRefs,overflow\}/);
  assert.match(app,/revision:.*this\.revision/);
  assert.match(app,/if\(this\.pending\)this\.dispatchPending\(\)/);
  assert.doesNotMatch(app,/setTimeout\(|setInterval\(|requestAnimationFrame\(/);
});

test('Buffet worker is calculation-only and returns a compact view model',()=>{
  assert.match(worker,/B\.plan\(input\|\|\{\}\)/);
  assert.match(worker,/function viewModel\(plan\)/);
  assert.match(worker,/serviceRows/);
  assert.match(worker,/dessertSummary/);
  assert.match(worker,/overflowItems/);
  assert.match(worker,/self\.postMessage\(\{revision,result:viewModel\(plan\)\}\)/);
  assert.doesNotMatch(worker,/document\.|window\.document|querySelector|createElement/);
});

test('Buffet client assets explicitly disable stale browser caching',()=>{
  assert.match(headers,/\/buffet-worker\.js\n  Cache-Control: no-store/);
});

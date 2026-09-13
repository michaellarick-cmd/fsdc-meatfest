import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const entry=await readFile(new URL('../public/buffet-ui.js',import.meta.url),'utf8');
const ui=await readFile(new URL('../public/buffet-ui-canonical-v3.js',import.meta.url),'utf8');
const worker=await readFile(new URL('../public/buffet-worker.js',import.meta.url),'utf8');
const headers=await readFile(new URL('../public/_headers',import.meta.url),'utf8');

test('Buffet uses one canonical persistent renderer',()=>{
  assert.match(entry,/buffet-ui-canonical(?:-v3)?\.js/);
  assert.doesNotMatch(entry,/s\.src=.*buffet-ui-v9|s\.src=.*side-ui\.js|s\.src=.*buffet-mobile-fixes/);
  assert.match(ui,/SERVICE QUANTITIES/);
  assert.match(ui,/TABLE-BY-TABLE SETUP/);
  assert.match(ui,/function renderService\(p\)/);
  assert.match(ui,/function renderLayout\(p\)/);
  assert.match(ui,/function stableSideOwner\(\)/);
  assert.match(ui,/window\.renderSideCards=sync/);
  assert.match(ui,/\.sideCard'\)\.forEach\(el\.onclick=null/);
  assert.doesNotMatch(ui,/\.innerHTML\s*=/);
  assert.doesNotMatch(ui,/scrollTo\(|scrollBy\(|new MutationObserver|window\.Worker\s*=/);
  assert.doesNotMatch(ui,/addEventListener\('click',handle,true\)/);
  assert.match(ui,/new Worker\('\/buffet-worker\.js\?v=12'\)/);
});

test('major Buffet sections have explicit persistent owners and stable geometry',()=>{
  assert.match(ui,/dataset\.mfSection=id/);
  for(const name of ['supplemental','bread','sausage','condiments','desserts','service','layout'])assert.match(ui,new RegExp(`'${name}'`));
  assert.match(ui,/ui\.serviceRows\[k\]/);
  assert.match(ui,/ui\.layout\.rows\.push/);
  assert.match(ui,/ui\.dessertSummary/);
  assert.match(ui,/ui\.layout\.overflow/);
  assert.match(ui,/function buffetVisible\(\)/);
  assert.match(ui,/function scheduleRender\(\)/);
  assert.match(ui,/function maybeRender\(\)/);
  assert.match(ui,/if\(busy\|\|!latestPlan\|\|!buffetVisible\(\)\)\{/);
  assert.match(ui,/function requestPlan\(immediate=false\)/);
  assert.match(ui,/!busy&&!queued&&!latestPlan&&buffetVisible\(\)\)requestPlan\(true\)/);
  assert.match(ui,/latestPlan=e\.data\.result/);
  assert.doesNotMatch(ui,/worker\.onmessage=e=>\{busy=false;if\(e\.data\?\.result\)\{renderService/);
  assert.doesNotMatch(ui,/o\.r\.hidden=false/);
  assert.doesNotMatch(ui,/o\.r\.hidden=false;o\.name\.textContent/);
  assert.doesNotMatch(ui,/querySelector\('\.mfDessertSummary'\)/);
  assert.doesNotMatch(ui,/querySelector\('\.mfOverflow'\)/);
});

test('Buffet worker returns a compact presentation view model',()=>{
  assert.match(worker,/function viewModel\(plan\)/);
  assert.match(worker,/serviceRows/);
  assert.match(worker,/dessertSummary/);
  assert.match(worker,/overflowItems/);
  assert.match(worker,/self\.postMessage\(\{id,result:viewModel\(plan\)\}\)/);
  assert.doesNotMatch(worker,/postMessage\(\{id,plan,result:plan\}\)/);
});

test('Buffet client assets explicitly disable stale browser caching',()=>{
  assert.match(headers,/\/buffet-ui-canonical\.js\n  Cache-Control: no-store/);
  assert.match(headers,/\/buffet-worker\.js\n  Cache-Control: no-store/);
});

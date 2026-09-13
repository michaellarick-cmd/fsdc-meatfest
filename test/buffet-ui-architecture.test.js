const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname,'..');
const ui = fs.readFileSync(path.join(root,'public/buffet-ui-canonical.js'),'utf8');
const worker = fs.readFileSync(path.join(root,'public/buffet-worker.js'),'utf8');
const entry = fs.readFileSync(path.join(root,'public/buffet-ui.js'),'utf8');

test('Buffet uses one canonical persistent renderer',()=>{
  assert.match(entry,/buffet-ui-canonical\.js/);
  assert.doesNotMatch(entry,/buffet-ui-v9\.js/);
  assert.match(ui,/Persistent DOM/);
  assert.doesNotMatch(ui,/\.innerHTML/);
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
  assert.match(ui,/if\(scrolling\|\|busy\|\|!latestPlan\|\|!buffetVisible\(\)\)return/);
  assert.match(ui,/latestPlan=e\.data\?\.result/);
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
  const headers=fs.readFileSync(path.join(root,'public/_headers'),'utf8');
  assert.match(headers,/buffet-ui-canonical\.js/);
  assert.match(headers,/buffet-worker\.js/);
});

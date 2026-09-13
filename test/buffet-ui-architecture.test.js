import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const entry=await readFile(new URL('../public/buffet-ui.js',import.meta.url),'utf8');
const ui=await readFile(new URL('../public/buffet-ui-canonical.js',import.meta.url),'utf8');

test('Buffet uses one canonical persistent renderer',()=>{
  assert.match(entry,/buffet-ui-canonical\.js/);
  assert.doesNotMatch(entry,/s\.src=.*buffet-ui-v9|s\.src=.*side-ui\.js|s\.src=.*buffet-mobile-fixes/);
  assert.match(ui,/SERVICE QUANTITIES/);
  assert.match(ui,/TABLE-BY-TABLE SETUP/);
  assert.match(ui,/function renderService\(p\)/);
  assert.match(ui,/function renderLayout\(p\)/);
  assert.match(ui,/function stableSideOwner\(\)/);
  assert.match(ui,/window\.renderSideCards=sync/);
  assert.match(ui,/\.sideCard'\)\.forEach\(el=>el\.onclick=null/);
  assert.doesNotMatch(ui,/\.innerHTML\s*=/);
  assert.doesNotMatch(ui,/scrollTo\(|scrollBy\(|new MutationObserver|window\.Worker\s*=/);
  assert.doesNotMatch(ui,/addEventListener\('click',handle,true\)/);
  assert.match(ui,/new Worker\('\/buffet-worker\.js\?v=11'\)/);
});

test('major Buffet sections have explicit persistent owners and stable geometry',()=>{
  assert.match(ui,/dataset\.mfSection=id/);
  for(const name of ['supplemental','bread','sausage','condiments','desserts','service','layout'])assert.match(ui,new RegExp(`'${name}'`));
  assert.match(ui,/ui\.serviceRows\[k\]/);
  assert.match(ui,/ui\.layout\.rows\.push/);
  assert.match(ui,/o\.r\.hidden=false/);
  assert.match(ui,/o\.r\.hidden=false;o\.name\.textContent/);
});

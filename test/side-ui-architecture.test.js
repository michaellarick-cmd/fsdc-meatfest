import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const side=await readFile(new URL('../public/side-ui.js',import.meta.url),'utf8');
const entry=await readFile(new URL('../public/buffet-ui.js',import.meta.url),'utf8');
test('accompaniment controls use a persistent DOM controller',()=>{
  assert.match(entry,/side-ui\.js/);
  assert.match(side,/window\.renderSideCards=\(\)=>sync\(\)/);
  assert.match(side,/main\.addEventListener\('click',handle\)/);
  assert.match(side,/accomp\.addEventListener\('click',handle\)/);
  assert.doesNotMatch(side,/new MutationObserver|scrollTo\(|scrollBy\(|window\.Worker\s*=/);
});

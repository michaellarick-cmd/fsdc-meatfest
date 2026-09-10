import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../public/buffet-layout.js',import.meta.url),'utf8');

test('buffet layout derives print allocation from BuffetEngine plan',()=>{
  assert.match(source,/function currentPlan\(\)/);
  assert.match(source,/B\.plan\(\{/);
  assert.match(source,/p\.tables\.layout/);
  assert.match(source,/layout\.linearRequired/);
  assert.match(source,/layout\.overflowIn/);
});

test('buffet layout keeps screen and print on the canonical four-table footprint',()=>{
  assert.match(source,/3 × 6' \+ 1 × 4'/);
  assert.match(source,/66 sq ft/);
  assert.match(source,/segments\.map\(seg=>/);
});

test('buffet layout does not use regex item classification for print allocation',()=>{
  assert.doesNotMatch(source,/seq\.filter\(x=>\/plate\|slaw\|coleslaw/);
  assert.match(source,/renderPrintAllocation/);
});

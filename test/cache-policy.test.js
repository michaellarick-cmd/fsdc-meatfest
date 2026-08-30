import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const headers=await readFile(new URL('../public/_headers',import.meta.url),'utf8');

test('static application assets use an explicit no-store cache policy',()=>{
  for(const path of ['/app.js','/meat-engine.js','/meatfest-final.js']){
    assert.match(headers,new RegExp(`${path.replaceAll('.','\\.')}\\n\\s+Cache-Control:\\s*no-store`));
  }
  assert.doesNotMatch(headers,/^\/\*\n\s+Cache-Control:\s*no-store/m);
});

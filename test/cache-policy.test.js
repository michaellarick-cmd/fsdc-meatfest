import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const headers=await readFile(new URL('../public/_headers',import.meta.url),'utf8');

test('static asset cache policy keeps the live application fresh',()=>{
  assert.match(headers,/^\/\*\n\s+Cache-Control:\s*no-store/m);
});

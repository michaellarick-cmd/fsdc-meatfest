import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const entry=await readFile(new URL('../public/buffet-ui.js',import.meta.url),'utf8');
const ui=await readFile(new URL('../public/buffet-ui-v4.js',import.meta.url),'utf8');
test('buffet UI uses one stable implementation with a direct worker boundary',()=>{assert.match(entry,/buffet-ui-v4\.js/);assert.doesNotMatch(entry,/buffet-ui-v2\.js|buffet-ui-v3\.js|buffet-mobile-fixes\.js/);assert.doesNotMatch(entry,/window\.Worker\s*=|new MutationObserver|scrollTo\(|scrollBy\(/);assert.match(ui,/new Worker\('\/buffet-worker\.js\?v=5'\)/);assert.doesNotMatch(ui,/window\.Worker\s*=|new MutationObserver|scrollTo\(|scrollBy\(/)});
test('buffet UI does not calculate or rebuild the plan during initial page load',()=>{assert.doesNotMatch(ui,/shell\(\);[^\n]*send\(\)/s);assert.match(ui,/shell\(\);/)});

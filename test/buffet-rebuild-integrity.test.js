import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

const root=process.cwd();
const publicDir=path.join(root,'public');
const testDir=path.join(root,'test');
const read=(file)=>fs.readFileSync(path.join(root,file),'utf8');

const currentProductionFiles=[
  'public/buffet-app.js',
  'public/buffet-ui.js',
  'public/buffet-worker.js',
  'public/buffet-engine.js',
  'public/buffet-allocation.js'
];

const obsoleteFiles=[
  'public/buffet-ui-canonical.js',
  'public/buffet-ui-canonical-v3.js',
  'public/buffet-ui-v3.js',
  'public/buffet-ui-v4.js',
  'public/buffet-ui-v5.js',
  'public/buffet-ui-v6.js',
  'public/buffet-ui-v7.js',
  'public/buffet-ui-v8.js',
  'public/buffet-layout.js',
  'test/buffet-interaction-performance-fixed.test.cjs'
];

const legacyReferences=[
  'buffetLayoutDynamic',
  'buffetDynamic',
  'maybeRender',
  'installScrollGate',
  'buffetVisible',
  'ensureVisiblePlan',
  'visibilityTimer',
  'scrollSettleTimer',
  'renderCheckTimer',
  'stableSideOwner',
  '/buffet-worker.js?v=12',
  '.b9table',
  '.b9row',
  'data-k="'
];

test('rebuilt Buffet production surface is complete and legacy files are absent',()=>{
  for(const file of currentProductionFiles)assert.equal(fs.existsSync(path.join(root,file)),true,`missing current Buffet file: ${file}`);
  for(const file of obsoleteFiles)assert.equal(fs.existsSync(path.join(root,file)),false,`obsolete Buffet file remains: ${file}`);
});

test('rebuilt Buffet repository contains no legacy architecture references',()=>{
  const files=[];
  const walk=(dir)=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){if(entry.name==='node_modules'||entry.name==='.git')continue;const full=path.join(dir,entry.name);if(entry.isDirectory())walk(full);else if(/\.(?:js|cjs|html|yml|yaml|json)$/.test(entry.name))files.push(full)}};
  walk(root);
  const offenders=[];
  for(const file of files){const text=fs.readFileSync(file,'utf8');for(const token of legacyReferences)if(text.includes(token))offenders.push(`${path.relative(root,file)} -> ${token}`)}
  assert.deepEqual(offenders,[],`legacy Buffet references remain:\n${offenders.join('\n')}`);
});

test('rebuilt Buffet architecture has one worker contract and one custom-element host',()=>{
  const app=read('public/buffet-app.js');
  const ui=read('public/buffet-ui.js');
  assert.equal((app.match(/new Worker\(/g)||[]).length,1);
  assert.match(app,/const WORKER_URL='\/buffet-worker\.js\?v=4'/);
  assert.match(app,/customElements\.define\('meatfest-buffet'/);
  assert.match(ui,/const APP_SRC = '\/buffet-app\.js\?v=4'/);
  assert.equal((ui.match(/appendChild\(host\)/g)||[]).length,0);
});

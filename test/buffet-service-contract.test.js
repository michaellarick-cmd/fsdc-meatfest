import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const engine=fs.readFileSync(new URL('../public/buffet-engine.js',import.meta.url),'utf8');
const document={getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[]};
const window={BuffetEngine:null,buildSummary:null};
const context={window,document,globalThis:{},requestAnimationFrame:fn=>fn(),setTimeout:()=>0,MutationObserver:class{observe(){}disconnect(){}}};
vm.runInNewContext(engine,context);
window.BuffetEngine=context.globalThis.BuffetEngine;
const B=window.BuffetEngine;

test('service contract: side vessels and service methods are explicit',()=>{
  assert.equal(B.SIDES.mac.vessel,'chafer');
  assert.equal(B.SIDES.cauliflowerMac.vessel,'chafer');
  assert.equal(B.SIDES.cauliflowerMac.service.method,'half-chafer');
  assert.equal(B.SIDES.collards.vessel,'bowl');
  assert.equal(B.SIDES.collards.service.method,'tongs');
  assert.equal(B.SIDES.corn.service.method,'half-ear');
  assert.equal(B.SIDES.beans.service.method,'ladle');
  assert.equal(B.SIDES.sauerkraut.service.method,'spoon');
});

test('service contract: breads remain functionally separated from sausage service',()=>{
  assert.equal(B.BREADS.hawaiian.service.method,'basket');
  assert.match(B.BREADS.hawaiian.service.note,/not a sausage bun/i);
  assert.equal(B.BREADS.cornbread.service.method,'basket');
  assert.equal(B.BREADS.bratBuns.requires,'brats');
});

test('service contract: sausage modes are explicit and mutually meaningful',()=>{
  assert.match(B.SAUSAGE_MODES.polish.label,/¼-inch rounds/);
  assert.match(B.SAUSAGE_MODES.traditional.label,/2–3 sections/);
  assert.match(B.SAUSAGE_MODES.primary.label,/whole links \+ buns/);
  assert.match(B.SAUSAGE_MODES.polish.note,/sauerkraut/i);
});

test('service contract: physical buffet footprint is fixed and dessert is separate',()=>{
  assert.deepEqual(Array.from(B.TABLE_GEOMETRY.main),[72,72,72,48]);
  assert.deepEqual(Array.from(B.TABLE_GEOMETRY.dessert),[48]);
  assert.equal(B.TABLE_GEOMETRY.label,'U-shape');
  assert.equal(B.VESSELS.chafer.linearIn,21);
  assert.equal(B.VESSELS.bowl.linearIn,14);
  assert.equal(B.VESSELS.basket.linearIn,12);
  assert.equal(B.VESSELS.jar.linearIn,4);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../public/buffet-engine.js',import.meta.url),'utf8');
const context={globalThis:{}};
vm.runInNewContext(source,context);
const B=context.globalThis.BuffetEngine;

test('two half tins share one physical chafer',()=>{
  const groups=B.physicalPlan([
    {type:'side',id:'mac',name:'Mac & Cheese',side:B.SIDES.mac,vessel:B.VESSELS.chafer,quantity:{amount:.5,unit:'tin'}},
    {type:'side',id:'cauliflowerMac',name:'Cauliflower Mac',side:B.SIDES.cauliflowerMac,vessel:B.VESSELS.chafer,quantity:{amount:.5,unit:'tin'}}
  ]);
  assert.equal(groups.length,1);
  assert.equal(groups[0].linearIn,21);
  assert.deepEqual(groups[0].items.map(x=>x.id),['mac','cauliflowerMac']);
  assert.deepEqual(groups[0].items.map(x=>x.serviceFill),['quarter','quarter']);
});

test('three-quarter tin plus quarter tin share one physical chafer',()=>{
  const groups=B.physicalPlan([
    {type:'side',id:'mac',name:'Mac & Cheese',side:B.SIDES.mac,vessel:B.VESSELS.chafer,quantity:{amount:.75,unit:'tin'}},
    {type:'side',id:'beans',name:'Baked Beans',side:B.SIDES.beans,vessel:B.VESSELS.chafer,quantity:{amount:.25,unit:'tin'}}
  ]);
  assert.equal(groups.length,1);
  assert.equal(groups[0].linearIn,21);
  assert.deepEqual(groups[0].items.map(x=>x.serviceFill),['quarter','quarter','quarter','quarter']);
});

test('buffet bread selection is driven by Accompaniment selections',()=>{
  const ui=fs.readFileSync(new URL('../public/buffet-ui.js',import.meta.url),'utf8');
  assert.match(ui,/function accompanimentBreadIds\(\)/);
  assert.match(ui,/selectedSides\.has\('rolls'\).*hawaiian/);
  assert.match(ui,/selectedSides\.has\('cornbread'\).*cornbread/);
  assert.match(ui,/state\.breadIds=accompanimentBreadIds\(\)/);
  assert.match(ui,/Driven by the Accompaniment selections above/);
});

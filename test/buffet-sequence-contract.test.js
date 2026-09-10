import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const engine=fs.readFileSync(new URL('../public/buffet-engine.js',import.meta.url),'utf8');
const context={window:{BuffetEngine:null},document:{getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[]},globalThis:{},requestAnimationFrame:fn=>fn(),setTimeout:()=>0,MutationObserver:class{observe(){}disconnect(){}}};
vm.runInNewContext(engine,context);
const B=context.globalThis.BuffetEngine;

function plan(){return B.plan({
  eaters:44,
  proteinKeys:['chicken','pork','pmbe','ribs','brisket','brats'],
  sideIds:['cucumber','coleslaw','corn','mac','beans','sauerkraut','cauli'],
  breadIds:['hawaiian'],
  condimentIds:['bbqSauce','pickles','mustard'],
  dessertIds:[]
});}

test('canonical guest flow: plates through cold, vegetables, starches, proteins, bread and finish',()=>{
  const ids=plan().sequence.map(x=>x.id);
  const before=(a,b)=>assert.ok(ids.indexOf(a)>=0&&ids.indexOf(b)>=0&&ids.indexOf(a)<ids.indexOf(b),`${a} must precede ${b}`);
  before('plates','cucumber');
  before('cucumber','coleslaw');
  before('coleslaw','corn');
  before('corn','mac');
  before('mac','chicken');
  before('chicken','pork');
  before('pork','pmbe');
  before('pmbe','ribs');
  before('ribs','brisket');
  before('brisket','brats');
  before('brats','hawaiian');
  before('hawaiian','bbqSauce');
  before('bbqSauce','pickles');
  before('pickles','mustard');
});

test('canonical guest flow: sauerkraut remains with specialty protein service rather than cold-side flow',()=>{
  const ids=plan().sequence.map(x=>x.id);
  assert.ok(ids.indexOf('sauerkraut')>ids.indexOf('brats'));
  assert.ok(ids.indexOf('sauerkraut')<ids.indexOf('hawaiian'));
});

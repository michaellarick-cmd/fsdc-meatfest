import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const engine=fs.readFileSync(new URL('../public/buffet-engine.js',import.meta.url),'utf8');
const layout=fs.readFileSync(new URL('../public/buffet-layout.js',import.meta.url),'utf8');
const document={getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[]};
const window={BuffetEngine:null,buildSummary:null};
const context={window,document,globalThis:{},requestAnimationFrame:fn=>fn(),setTimeout:()=>0};
vm.runInNewContext(engine,context);
window.BuffetEngine=context.globalThis.BuffetEngine;
vm.runInNewContext(layout,context);
const A=window.BuffetAllocation;
const B=window.BuffetEngine;

function fullMenu(){
  return B.plan({
    eaters:44,
    proteinKeys:['chicken','pork','pmbe','ribs','brisket','brats'],
    sideIds:['cucumber','coleslaw','corn','mac','beans','sauerkraut','cauli'],
    breadIds:['hawaiian'],
    condimentIds:['bbqSauce','pickles','mustard'],
    dessertIds:[]
  });
}

test('physical allocation: full menu uses actual vessel widths including jars',()=>{
  const p=fullMenu();
  assert.ok(p.tables.linearRequired>264,`expected full menu to exceed 264in, got ${p.tables.linearRequired}`);
  assert.equal(p.tables.linearProvided,264);
  assert.equal(p.tables.overflow,true);
  assert.deepEqual(p.tables.layout.recommendedTables,[72,72,72,48,48]);
});

test('physical allocation: cold sides stay on the left before starch/proteins',()=>{
  const p=fullMenu();
  const tables=p.tables.layout.segments;
  const t1=tables[0].items.flatMap(g=>g.items).map(x=>x.name||x.id);
  const t2=tables[1].items.flatMap(g=>g.items).map(x=>x.name||x.id);
  assert.ok(t1.includes('Cucumber Salad'));
  assert.ok(t1.includes('Coleslaw'));
  assert.ok(!t1.includes('Brisket'));
  assert.ok(t2.includes('Baked Beans'));
});

test('physical allocation: sauerkraut stays with the protein-side zone',()=>{
  const p=fullMenu();
  const tables=p.tables.layout.segments;
  const t3=tables[2].items.flatMap(g=>g.items).map(x=>x.name||x.id);
  assert.ok(t3.includes('Sauerkraut'));
});

test('physical allocation: condiment jars consume real surface space',()=>{
  const groups=[{station:'finish',linearIn:0,items:[{id:'bbqSauce',name:'BBQ Sauce',vessel:{type:'jar'}}]}];
  const out=A.allocate(groups,[48]);
  assert.equal(out.linearRequired,4);
  assert.equal(out.segments[0].used,4);
});

test('physical allocation: compact protein menu fits without false overflow',()=>{
  const p=B.plan({eaters:44,proteinKeys:['pork','brisket'],sideIds:['coleslaw','mac','beans'],breadIds:['hawaiian'],condimentIds:['bbqSauce'],dessertIds:[]});
  assert.equal(p.tables.overflow,false);
  assert.ok(p.tables.linearRequired<=264);
});

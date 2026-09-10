import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const engine=fs.readFileSync(new URL('../public/buffet-engine.js',import.meta.url),'utf8');
const layout=fs.readFileSync(new URL('../public/buffet-layout.js',import.meta.url),'utf8');
const document={getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[]};
const window={BuffetEngine:null,buildSummary:null};
const context={window,document,globalThis:{},requestAnimationFrame:fn=>fn(),setTimeout:()=>0,MutationObserver:class{observe(){}disconnect(){}}};
vm.runInNewContext(engine,context);window.BuffetEngine=context.globalThis.BuffetEngine;vm.runInNewContext(layout,context);
const A=window.BuffetAllocation,B=window.BuffetEngine;
function fullMenu(){return B.plan({eaters:44,proteinKeys:['chicken','pork','pmbe','ribs','brisket','brats'],sideIds:['cucumber','coleslaw','corn','mac','beans','sauerkraut','cauli'],breadIds:['hawaiian'],condimentIds:['bbqSauce','pickles','mustard'],dessertIds:[]})}
function itemNames(seg){return seg.items.flatMap(g=>g.items).map(x=>x.name||x.side?.name||x.bread?.name||x.item?.name||x.id)}

test('physical allocation: full menu uses actual vessel widths including jars',()=>{const p=fullMenu();assert.ok(p.tables.linearRequired>264);assert.equal(p.tables.linearProvided,264);assert.equal(p.tables.overflow,true);assert.deepEqual(Array.from(p.tables.layout.recommendedTables),[72,72,72,48,48])});
test('physical allocation: cold sides stay on the left before starch/proteins',()=>{const tables=fullMenu().tables.layout.segments,t1=itemNames(tables[0]),all=tables.flatMap(itemNames);assert.ok(t1.includes('Cucumber Salad'));assert.ok(t1.includes('Coleslaw'));assert.ok(!t1.includes('Brisket'));assert.ok(all.includes('Baked Beans'));assert.ok(tables.slice(1).some(t=>itemNames(t).includes('Baked Beans')))});
test('physical allocation: sauerkraut stays out of the cold-side zone',()=>{const tables=fullMenu().tables.layout.segments;assert.ok(tables.slice(1).some(t=>itemNames(t).includes('Sauerkraut')));assert.ok(!itemNames(tables[0]).includes('Sauerkraut'))});
test('physical allocation: condiment jars consume real surface space',()=>{const out=A.allocate([{station:'finish',linearIn:0,items:[{id:'bbqSauce',name:'BBQ Sauce',vessel:{type:'jar'}}]}],[48]);assert.equal(out.linearRequired,4);assert.equal(out.segments[0].used,4)});
test('physical allocation: minimal menu fits without false overflow',()=>{const p=B.plan({eaters:44,proteinKeys:['pork'],sideIds:['coleslaw'],dessertIds:[]});assert.equal(p.tables.overflow,false);assert.ok(p.tables.linearRequired<=264)});

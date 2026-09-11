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
function overflowNames(layout){return layout.overflowGroups.flatMap(g=>g.items).map(x=>x.name||x.side?.name||x.bread?.name||x.item?.name||x.id)}

test('physical allocation: full menu uses actual vessel widths including jars',()=>{const p=fullMenu();assert.ok(p.tables.linearRequired>264);assert.equal(p.tables.linearProvided,264);assert.equal(p.tables.overflow,true);assert.deepEqual(Array.from(p.tables.layout.recommendedTables),[72,72,72,48,48])});
test('physical allocation: cold sides stay on the left before starch/proteins',()=>{const tables=fullMenu().tables.layout.segments,t1=itemNames(tables[0]),all=tables.flatMap(itemNames);assert.ok(t1.includes('Cucumber Salad'));assert.ok(t1.includes('Coleslaw'));assert.ok(!t1.includes('Brisket'));assert.ok(all.includes('Baked Beans')||overflowNames(fullMenu().tables.layout).includes('Baked Beans'))});
test('physical allocation: sauerkraut stays out of the cold-side zone',()=>{const layout=fullMenu().tables.layout;assert.ok(layout.segments.slice(1).some(t=>itemNames(t).includes('Sauerkraut'))||overflowNames(layout).includes('Sauerkraut'));assert.ok(!itemNames(layout.segments[0]).includes('Sauerkraut'))});
test('physical allocation: condiment jars consume real surface space',()=>{const out=A.allocate([{station:'finish',linearIn:0,items:[{id:'bbqSauce',name:'BBQ Sauce',vessel:{type:'jar'}}]}],[48]);assert.equal(out.linearRequired,4);assert.equal(out.segments[0].used,4)});
test('physical allocation: minimal menu fits without false overflow',()=>{const p=B.plan({eaters:44,proteinKeys:['pork'],sideIds:['coleslaw'],dessertIds:[]});assert.equal(p.tables.overflow,false);assert.ok(p.tables.linearRequired<=264)});
test('physical allocation: large vessels are placed before smaller vessels within a station',()=>{const groups=[30,30,30,42,42,42].map((linearIn,i)=>({station:'starch',linearIn,items:[{id:`g${i}`,name:`Group ${i}`,vessel:{type:'chafer'}}]}));const out=A.allocate(groups,[72,72,72]);assert.equal(out.overflow,false);assert.deepEqual(Array.from(out.segments.map(s=>s.used)),[72,72,72]);assert.equal(JSON.stringify(Array.from(out.segments.map(s=>Array.from(s.items).map(g=>g.items[0].id)))),JSON.stringify([['g3','g0'],['g4','g1'],['g5','g2']]))});
test('station plan: every placed service item carries setup instructions',()=>{const layout=fullMenu().tables.layout;assert.equal(layout.stationPlan.length,4);const placed=layout.stationPlan.flatMap(t=>t.items);assert.ok(placed.length>0);for(const item of placed){assert.ok(item.name);assert.ok(item.station);assert.ok(item.vessel);assert.ok(item.service)}const sauerkrautPlaced=placed.some(x=>x.name==='Sauerkraut'&&x.service.includes('spoon'));const sauerkrautOverflow=overflowNames(layout).includes('Sauerkraut');assert.ok(sauerkrautPlaced||sauerkrautOverflow);assert.ok(placed.some(x=>x.name==='Baked Beans'&&x.service.includes('ladle'))||overflowNames(layout).includes('Baked Beans'));assert.ok(placed.some(x=>x.name==='Hawaiian Rolls'&&x.service.includes('bread'))||overflowNames(layout).includes('Hawaiian Rolls'))});
test('station plan: table records preserve guest-flow station order',()=>{const plan=fullMenu().tables.layout.stationPlan;const ranks=plan.flatMap(t=>t.stations.map(s=>['entry','cold','vegetable','starch','core','specialty','bread','finish'].indexOf(s.id)));assert.equal(JSON.stringify(ranks),JSON.stringify([...ranks].sort((a,b)=>a-b))) });

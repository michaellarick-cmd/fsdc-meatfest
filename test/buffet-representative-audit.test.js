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
const B=window.BuffetEngine;

const STATION_RANK={entry:0,cold:0,vegetable:1,starch:1,core:2,specialty:2,bread:3,finish:3};
function names(seg){return seg.items.flatMap(g=>g.items||[]).map(x=>x.name||x.side?.name||x.bread?.name||x.item?.name||x.id)}
function groupWidth(g){return g.items?.[0]?.vessel?.type==='jar'?4:Math.max(0,Number(g.linearIn)||0)}
function audit(name,input){
  const p=B.plan(input),a=p.tables.layout;
  const placed=new Set();
  for(const seg of a.segments){
    assert.ok(seg.used<=seg.length+1e-9,`${name}: Table ${seg.table} exceeds capacity`);
    for(const g of seg.items){
      assert.ok(!placed.has(g),`${name}: service group placed twice`);
      placed.add(g);
      const preferred=g.items?.some(x=>x.id==='sauerkraut')?2:(STATION_RANK[g.station]??3);
      assert.ok(seg.table-1>=Math.min(preferred,a.segments.length-1),`${name}: ${g.station} group moved backward from its preferred zone`);
    }
  }
  const accounted=a.segments.reduce((s,x)=>s+x.used,0)+a.overflowGroups.reduce((s,g)=>s+groupWidth(g),0);
  assert.equal(a.linearRequired,accounted,`${name}: physical linear inches are not fully accounted for`);
  console.log(JSON.stringify({name,required:a.linearRequired,provided:a.linearProvided,overflowIn:a.overflowIn,recommended:Array.from(a.recommendedTables),overflowItems:a.overflowItems,tables:a.segments.map(s=>({table:s.table,length:s.length,used:s.used,stations:Array.from(s.stations),items:names(s)}))},null,2));
  return p;
}

const menus=[
  ['small menu / 20 eaters',{
    eaters:20,proteinKeys:['pork'],sideIds:['coleslaw','beans','corn'],breadIds:['hawaiian'],condimentIds:['bbqSauce'],dessertIds:[]
  }],
  ['normal Meatfest / 32 eaters',{
    eaters:32,proteinKeys:['chicken','pork','pmbe','brisket'],sideIds:['cucumber','coleslaw','mac','collards','beans'],breadIds:['hawaiian'],condimentIds:['bbqSauce','pickles'],dessertIds:[]
  }],
  ['full Meatfest / 44 eaters',{
    eaters:44,proteinKeys:['chicken','pork','pmbe','ribs','brisket','brats'],sideIds:['cucumber','coleslaw','corn','mac','beans','sauerkraut','cauli'],breadIds:['hawaiian'],condimentIds:['bbqSauce','pickles','mustard'],dessertIds:[]
  }],
  ['normal menu + supplemental grilling / 32 eaters',{
    eaters:32,proteinKeys:['chicken','pork','brisket'],sideIds:['coleslaw','mac','cucumber'],breadIds:['hawaiian','burgerBuns','hotDogBuns','bratBuns'],supplementalIds:['burgers','hotdogs','brats'],condimentIds:['bbqSauce','mustard'],dessertIds:[]
  }],
  ['Mac + Cauli + fresh sides / 44 eaters',{
    eaters:44,proteinKeys:['pork','pmbe','brisket'],sideIds:['mac','cauli','coleslaw','cucumber','collards'],breadIds:['hawaiian'],condimentIds:['bbqSauce','pickles'],dessertIds:[]
  }]
];

for(const [name,input] of menus)test(`representative buffet audit: ${name}`,()=>{
  const p=audit(name,input);
  assert.deepEqual(Array.from(p.tables.layout.tableLengths),[72,72,72,48]);
});

test('representative buffet audit: full menu is the only canonical case expected to require the fifth table',()=>{
  const p=B.plan({eaters:44,proteinKeys:['chicken','pork','pmbe','ribs','brisket','brats'],sideIds:['cucumber','coleslaw','corn','mac','beans','sauerkraut','cauli'],breadIds:['hawaiian'],condimentIds:['bbqSauce','pickles','mustard'],dessertIds:[]});
  assert.equal(p.tables.overflow,true);
  assert.deepEqual(Array.from(p.tables.layout.recommendedTables),[72,72,72,48,48]);
});

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

const FLOW=['entry','cold','vegetable','starch','core','specialty','bread','finish'];
const zoneForTable={1:['entry','cold'],2:['vegetable','starch'],3:['core','specialty'],4:['bread','finish']};
const preferred=g=>g.items?.some(x=>x.id==='sauerkraut')?2:(zoneForTable[1].includes(g.station)?1:zoneForTable[2].includes(g.station)?2:zoneForTable[3].includes(g.station)?3:4);

function audit(name,input){
  const p=B.plan(input),layout=p.tables.layout;
  assert.deepEqual(Array.from(layout.tableLengths),[72,72,72,48],`${name}: canonical main footprint changed`);

  for(const seg of layout.segments){
    assert.ok(seg.used<=seg.length+1e-9,`${name}: table ${seg.table} exceeds physical capacity`);
    for(const g of seg.items){
      const expected=preferred(g);
      assert.ok(seg.table>=expected,`${name}: ${g.station} was moved backward from its guest-flow zone`);
      if(seg.table===expected){
        assert.ok(zoneForTable[seg.table].includes(g.station),`${name}: station ${g.station} is not in the table's flow zone`);
      }
    }
  }

  // The four-table path is one-directional: cold/fresh -> vegetables/starches -> proteins -> finish.
  const occupied=layout.segments.filter(s=>s.items.length).map(s=>s.table);
  for(let i=1;i<occupied.length;i++) assert.ok(occupied[i]>occupied[i-1],`${name}: guest path is not monotonic through the U`);

  // Sauerkraut is deliberately pulled into the protein zone so guests encounter it with Polish sausage.
  const kraut=layout.segments.flatMap(s=>s.items.map(g=>({table:s.table,g}))).find(x=>x.g.items?.some(i=>i.id==='sauerkraut'));
  if(kraut)assert.equal(kraut.table,3,`${name}: sauerkraut should stay with specialty proteins`);

  return layout;
}

test('guest flow audit: normal menu follows the U in service order',()=>{
  const layout=audit('normal',{
    eaters:32,
    proteinKeys:['chicken','pork','pmbe','brisket'],
    sideIds:['cucumber','coleslaw','mac','collards','beans'],
    breadIds:['hawaiian'],
    condimentIds:['bbqSauce','pickles'],
    dessertIds:[]
  });
  assert.deepEqual(layout.segments.map(s=>s.stations),[
    ['cold'],
    ['vegetable','starch'],
    ['starch','cold','core'],
    ['core','bread','finish']
  ]);
});

test('guest flow audit: full menu overflow is downstream, not a backward-flow assignment',()=>{
  const layout=audit('full',{
    eaters:44,
    proteinKeys:['chicken','pork','pmbe','ribs','brisket','brats'],
    sideIds:['cucumber','coleslaw','corn','mac','beans','sauerkraut','cauli'],
    breadIds:['hawaiian'],
    condimentIds:['bbqSauce','pickles','mustard'],
    dessertIds:[]
  });
  assert.equal(layout.overflow,true);
  assert.ok(layout.overflowGroups.every(g=>preferred(g)>=3),'overflow should favor downstream protein/specialty service before creating another table');
  assert.deepEqual(Array.from(layout.recommendedTables),[72,72,72,48,48]);
});

test('guest flow audit: supplemental grilling stays a separate appetite/service path',()=>{
  const layout=audit('supplemental',{
    eaters:32,
    proteinKeys:['chicken','pork','brisket'],
    sideIds:['coleslaw','mac','cucumber'],
    breadIds:['hawaiian','burgerBuns','hotDogBuns','bratBuns'],
    supplementalIds:['burgers','hotdogs','brats'],
    condimentIds:['bbqSauce','mustard'],
    dessertIds:[]
  });
  const stations=layout.segments.flatMap(s=>s.stations);
  assert.ok(stations.includes('bread')&&stations.includes('finish'));
});

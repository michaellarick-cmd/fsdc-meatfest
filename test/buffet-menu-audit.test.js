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

const menu=(eaters,proteinKeys,sideIds=[],extra={})=>B.plan({
  eaters,
  proteinKeys,
  sideIds,
  breadIds:extra.breadIds||[],
  supplementalIds:extra.supplementalIds||[],
  condimentIds:extra.condimentIds||[],
  dessertIds:extra.dessertIds||[],
  load:extra.load||'moderate',
  sausageMode:extra.sausageMode||'polish'
});

function names(groups=[]){return groups.flatMap(g=>(g.items||[]).map(x=>x.name||x.side?.name||x.bread?.name||x.item?.name||x.id));}
function stationRanks(groups=[]){const order=['entry','cold','vegetable','starch','core','specialty','bread','finish'];return groups.map(g=>order.indexOf(g.station));}

for(const eaters of [20,30,44]){
  test(`menu audit: ${eaters}-eater full core menu produces a coherent physical plan`,()=>{
    const p=menu(eaters,['chicken','pork','pmbe','ribs','brisket','brats'],['cucumber','coleslaw','corn','mac','beans','sauerkraut','cauli'],{breadIds:['hawaiian'],condimentIds:['bbqSauce','pickles','mustard']});
    assert.ok(p.tables.linearRequired>0);
    assert.equal(p.tables.linearProvided,264);
    assert.equal(p.tables.layout.tableLengths.join(','),'72,72,72,48');
    assert.ok(Array.isArray(p.tables.layout.segments));
    assert.ok(p.tables.layout.segments.length===4);
    assert.ok(p.tables.layout.recommendedTables.length>=4);
    for(const seg of p.tables.layout.segments)assert.ok(seg.used<=seg.length+1e-9);
    assert.ok(p.tables.layout.overflow === (p.tables.layout.overflowGroups.length>0 || p.tables.linearRequired>p.tables.linearProvided));
  });
}

test('menu audit: reducing protein variety does not reorder the buffet flow',()=>{
  const p=menu(30,['pork','brisket'],['cucumber','coleslaw','mac','beans'],{breadIds:['hawaiian'],condimentIds:['bbqSauce']});
  const ranks=stationRanks(p.serviceGroups);
  for(let i=1;i<ranks.length;i++)assert.ok(ranks[i]>=ranks[i-1],`station order regressed at ${i}`);
  assert.ok(p.tables.layout.segments.every(s=>s.used<=s.length+1e-9));
});

test('menu audit: heavy sides coexist without suppressing fresh sides to zero',()=>{
  const p=menu(44,['pork','brisket'],['mac','cauli','potatosalad','beans','coleslaw','cucumber','broccoli']);
  for(const id of ['mac','cauli','potatosalad','beans','coleslaw','cucumber','broccoli']){
    const row=p.sides.find(x=>x.id===id);
    assert.ok(row,`missing side ${id}`);
    assert.ok(Number(row.amount)>0,`zero quantity for ${id}`);
  }
  const mac=p.sides.find(x=>x.id==='mac'),cauli=p.sides.find(x=>x.id==='cauli');
  assert.ok(mac.amount>0&&cauli.amount>0);
});

test('menu audit: supplemental grilling is additive service, not a duplicate core station',()=>{
  const p=menu(30,['pork','brisket'],['coleslaw','mac'],{supplementalIds:['burgers','hotdogs','brats'],breadIds:['hawaiian']});
  assert.ok(p.supplemental);
  const n=names(p.serviceGroups);
  assert.ok(n.some(x=>/Burger/i.test(x)));
  assert.ok(n.some(x=>/Hot Dog/i.test(x)));
  assert.ok(n.some(x=>/Grilling Brats|Brats/i.test(x)));
  assert.ok(p.tables.layout.linearRequired>0);
});

test('menu audit: Polish sausage keeps sauerkraut paired with specialty proteins',()=>{
  const p=menu(30,['pork','brats'],['coleslaw','sauerkraut'],{condimentIds:['mustard']});
  const layout=p.tables.layout;
  const krautOnProteinZone=layout.segments.slice(1).some(s=>(s.items||[]).flatMap(g=>g.items||[]).some(x=>x.id==='sauerkraut'||x.name==='Sauerkraut'));
  const krautOverflow=(layout.overflowGroups||[]).some(g=>(g.items||[]).some(x=>x.id==='sauerkraut'||x.name==='Sauerkraut'));
  assert.ok(krautOnProteinZone||krautOverflow);
});

test('menu audit: dessert load produces a separate dessert station plan',()=>{
  for(const load of ['light','moderate','heavy']){
    const p=menu(30,['pork','brisket'],['coleslaw','mac'],{dessertIds:['cobbler','cookies'],load});
    assert.ok(p.dessert);
    assert.ok(p.dessertStation);
    assert.ok(p.dessertStation.tableLengths.join(',')==='48');
    assert.ok(p.dessertStation.separate===true || p.dessertStation.tableLengths.length===1);
  }
});

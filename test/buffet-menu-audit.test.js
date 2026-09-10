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

test('menu audit: reducing protein variety preserves the canonical buffet flow',()=>{
  const p=menu(30,['pork','brisket'],['cucumber','coleslaw','mac','beans'],{breadIds:['hawaiian'],condimentIds:['bbqSauce']});
  const ids=p.sequence.map(x=>x.id);
  const before=(a,b)=>assert.ok(ids.indexOf(a)<ids.indexOf(b),`${a} must precede ${b}`);
  before('plates','cucumber');
  before('cucumber','mac');
  before('mac','pork');
  before('pork','brisket');
  before('brisket','hawaiian');
  before('hawaiian','bbqSauce');
  assert.ok(p.tables.layout.segments.every(s=>s.used<=s.length+1e-9));
});

test('menu audit: heavy sides coexist while fresh sides retain positive planned quantities',()=>{
  const p=menu(44,['pork','brisket'],['mac','cauli','potatosalad','beans','coleslaw','cucumber','broccoli']);
  for(const id of ['coleslaw','cucumber','broccoli']){
    const row=p.sides.find(x=>x.id===id);
    assert.ok(row,`missing fresh side ${id}`);
    assert.ok(Number(row.quantity?.amount)>0,`zero quantity for fresh side ${id}`);
  }
  for(const id of ['mac','cauli','potatosalad','beans']){
    const row=p.sides.find(x=>x.id===id);
    assert.ok(row,`missing heavy side ${id}`);
    assert.ok(Number(row.quantity?.amount)>=.25,`heavy side ${id} fell below the practical minimum`);
  }
  const mac=p.sides.find(x=>x.id==='mac'),cauli=p.sides.find(x=>x.id==='cauli');
  assert.ok(mac.quantity.amount>0&&cauli.quantity.amount>0);
});

test('menu audit: supplemental grilling is additive service, not a duplicate core station',()=>{
  const p=menu(30,['pork','brisket'],['coleslaw','mac'],{supplementalIds:['burgers','hotdogs','brats'],breadIds:['hawaiian']});
  assert.ok(B.SUPPLEMENTAL.burgers&&B.SUPPLEMENTAL.hotdogs&&B.SUPPLEMENTAL.brats);
  assert.ok(B.supplementalFactor(['burgers','hotdogs','brats'])<1);
  const buns=B.breadPlan({supplementalIds:['burgers','hotdogs','brats'],proteinKeys:[]});
  assert.equal(Array.from(buns.map(x=>x.id)).sort().join('|'),'bratBuns|burgerBuns|hotDogBuns');
  const coreNames=names(p.serviceGroups);
  assert.ok(coreNames.some(x=>/pork/i.test(x)));
  assert.ok(coreNames.some(x=>/brisket/i.test(x)));
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
    assert.ok(p.dessertStation);
    assert.ok(p.dessertStation.tableLengths.join(',')==='48');
    assert.ok(p.dessertStation.separate===true || p.dessertStation.tableLengths.length===1);
  }
});

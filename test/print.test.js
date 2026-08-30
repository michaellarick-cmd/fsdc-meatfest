import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../public/meatfest-final.js',import.meta.url),'utf8');
const start=source.indexOf('window.populatePrint=function(){');
assert.ok(start>=0,'populatePrint is missing');
const bodyStart=source.indexOf('{',start);
let depth=0,end=-1;
for(let i=bodyStart;i<source.length;i++){if(source[i]==='{')depth++;else if(source[i]==='}'&&--depth===0){end=i+1;break}}
assert.ok(end>bodyStart,'populatePrint body could not be isolated');
const fnSource=source.slice(start,end).replace(/^window\.populatePrint=/,'globalThis.populatePrint=');

const elements=new Proxy({}, {get:(target,id)=>target[id]||(target[id]={textContent:'',innerHTML:''})});
const buildSummary=()=>({adults:33,kids:12,eaters:39,rows:[{key:'brisket',m:{name:'Brisket'},option:{label:'Whole Packer',yield:.5},row:{raw:28,finished:14},buy:'BUY 1 whole packer (~28 lb)'}],sideRows:[{id:'slaw',q:3},{id:'rolls',q:16}],total:28});
const eventDetails=()=>({name:'Labor Day Meatfest',display:'9/5/2026'});
const sides={slaw:{name:'Coleslaw'},rolls:{name:'Hawaiian Rolls'}};
const sideDetails=(id)=>id==='slaw'?'Anchor favorite.':'Sandwich vehicle.';
const sideBuyText=(id,q)=>id==='slaw'?`${q} recipes`:`${q} pieces`;
const buyText=(item)=>item.buy||`BUY 1 ${item.option?.label||'item'}`;
const MeatEngine={round1:(x)=>Math.round((x+Number.EPSILON)*10)/10};
const context={window:{buildSummary,eventDetails},buildSummary,eventDetails,sides,sideDetails,sideBuyText,buyText,MeatEngine,$:(id)=>elements[id],Math};
vm.createContext(context);
vm.runInContext(fnSource,context);

test('print builder populates event, attendee, protein, meat, sides, and total sections',()=>{
  context.populatePrint();
  assert.equal(elements.psTitle.textContent,'LABOR DAY MEATFEST');
  assert.equal(elements.psAdults.textContent,33);
  assert.equal(elements.psKids.textContent,12);
  assert.equal(elements.psEaters.textContent,39);
  assert.match(elements.psProteins.textContent,/Brisket/);
  assert.match(elements.psBuyRows.innerHTML,/whole packer/);
  assert.match(elements.psSides.innerHTML,/Coleslaw/);
  assert.match(elements.psSides.innerHTML,/Hawaiian Rolls/);
  assert.equal(elements.psTotal.textContent,'28 lb');
});

test('print builder handles an empty plan without throwing',()=>{
  context.window.buildSummary=()=>({adults:0,kids:0,eaters:0,rows:[],sideRows:[],total:0});
  context.buildSummary=context.window.buildSummary;
  context.populatePrint();
  assert.match(elements.psProteins.textContent,/No proteins selected/);
  assert.match(elements.psBuyRows.innerHTML,/No proteins selected/);
  assert.match(elements.psSides.innerHTML,/No sides selected/);
  assert.equal(elements.psTotal.textContent,'0 lb');
});

test('hero total is labeled as purchase weight, not raw requirement',()=>{
  assert.ok(source.includes('querySelector(".hero .small")'));
  assert.ok(source.includes('textContent="TOTAL PURCHASE WEIGHT"'));
  assert.ok(!source.includes('textContent="TOTAL RAW MEAT TO BUY"'));
});

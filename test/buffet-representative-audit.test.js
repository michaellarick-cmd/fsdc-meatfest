const test = require('node:test');
const assert = require('node:assert/strict');
const { loadBuffetEngine } = require('./helpers');
const B = loadBuffetEngine();

const menus=[
  ['small menu / 20 eaters',{eaters:20,proteinKeys:['pork'],sideIds:['coleslaw','corn','beans'],breadIds:['hawaiian'],condimentIds:['bbqSauce'],dessertIds:[]}],
  ['normal Meatfest / 32 eaters',{eaters:32,proteinKeys:['chicken','pork','pmbe'],sideIds:['cucumber','coleslaw','collards','mac','beans'],breadIds:['hawaiian'],condimentIds:['bbqSauce','pickles'],dessertIds:[]}],
  ['full Meatfest / 44 eaters',{eaters:44,proteinKeys:['chicken','pork','pmbe','ribs','brisket','brats'],sideIds:['cucumber','coleslaw','corn','mac','beans','sauerkraut','cauli'],breadIds:['hawaiian'],condimentIds:['bbqSauce','pickles','mustard'],dessertIds:[]}],
  ['normal menu + supplemental grilling / 32 eaters',{eaters:32,proteinKeys:['chicken','pork','brisket'],sideIds:['cucumber','coleslaw','mac'],breadIds:['hamburger','hotdog','brat'],condimentIds:['bbqSauce','mustard'],supplementalIds:['burgers','hotdogs'],dessertIds:[]}],
  ['Mac + Cauli + fresh sides / 44 eaters',{eaters:44,proteinKeys:['pork','pmbe','brisket'],sideIds:['cucumber','coleslaw','collards','mac','cauli'],breadIds:['hawaiian'],condimentIds:['bbqSauce','pickles'],dessertIds:[]}
];

const audit=(name,input)=>({name, ...B.plan(input)});

for(const [name,input] of menus)test(`representative buffet audit: ${name}`,()=>{
  const p=audit(name,input);
  assert.deepEqual(Array.from(p.tables.layout.tableLengths),[72,72,72,48]);
  if(name==='normal Meatfest / 32 eaters'||name==='normal menu + supplemental grilling / 32 eaters'||name==='Mac + Cauli + fresh sides / 44 eaters')assert.equal(p.tables.overflow,false,`${name}: should fit the canonical four-table footprint`);
});

test('representative buffet audit: full menu reports the actual table-capacity deficit',()=>{
  const p=B.plan({eaters:44,proteinKeys:['chicken','pork','pmbe','ribs','brisket','brats'],sideIds:['cucumber','coleslaw','corn','mac','beans','sauerkraut','cauli'],breadIds:['hawaiian'],condimentIds:['bbqSauce','pickles','mustard'],dessertIds:[]});
  assert.equal(p.tables.overflow,true);
  assert.equal(p.tables.layout.overflowIn,40);
  assert.equal(p.tables.layout.displacedIn,40);
  assert.equal(p.tables.layout.linearRequired-p.tables.layout.overflowIn,264);
  assert.deepEqual(Array.from(p.tables.layout.recommendedTables),[72,72,72,72,48]);
  assert.ok(p.tables.layout.recommendedLayout);
  assert.equal(p.tables.layout.recommendedLayout.overflow,false);
  assert.equal(p.tables.layout.recommendedLayout.linearProvided,336);
});
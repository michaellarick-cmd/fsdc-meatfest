import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../public/buffet-engine.js',import.meta.url),'utf8');
const context={globalThis:{}};
vm.runInNewContext(source,context);
const B=context.globalThis.BuffetEngine;

function side(plan,id){return plan.find(x=>x.id===id)?.quantity?.amount ?? null}
function make({eaters=44,proteins=['chicken','pork','pmbe','ribs','brisket','brats'],sides=['mac','cauli','potatosalad','coleslaw','collards','cucumber','beans','corn']}={}){
  return B.sidePlan({eaters,proteinKeys:proteins,sideIds:sides});
}

test('scenario matrix: side quantities increase with eater count',()=>{
  const small=make({eaters:44});
  const large=make({eaters:88});
  for(const id of ['mac','cauli','potatosalad','coleslaw','collards','cucumber','beans','corn']) assert.ok(side(large,id)>=side(small,id),`${id} decreased from 44 to 88 eaters`);
});

test('scenario matrix: more selected proteins do not increase side demand',()=>{
  const one=make({proteins:['pork']});
  const three=make({proteins:['pork','chicken','brisket']});
  const six=make({proteins:['chicken','pork','pmbe','ribs','brisket','brats']});
  for(const id of ['mac','cauli','potatosalad','coleslaw','collards','cucumber','beans','corn']){
    assert.ok(side(one,id)>=side(three,id),`${id} increased from 1 to 3 proteins`);
    assert.ok(side(three,id)>=side(six,id),`${id} increased from 3 to 6 proteins`);
  }
});

test('scenario matrix: Mac and Cauliflower Mac compete rather than stack',()=>{
  const macOnly=make({sides:['mac']});
  const cauliOnly=make({sides:['cauli']});
  const both=make({sides:['mac','cauli']});
  assert.ok(side(both,'mac')<side(macOnly,'mac'),'Mac was not suppressed when Cauliflower Mac was selected');
  assert.ok(side(both,'cauli')<side(cauliOnly,'cauli'),'Cauliflower Mac was not suppressed when Mac was selected');
});

test('scenario matrix: fresh sides are not suppressed by heavy-side selection',()=>{
  const freshOnly=make({sides:['cucumber','coleslaw']});
  const withHeavy=make({sides:['cucumber','coleslaw','mac','potatosalad','beans']});
  assert.ok(side(withHeavy,'cucumber')>=side(freshOnly,'cucumber'));
  assert.ok(side(withHeavy,'coleslaw')>=side(freshOnly,'coleslaw'));
});

test('scenario matrix: 44-eater full-menu plan reports physical table overflow honestly',()=>{
  const p=B.plan({eaters:44,proteinKeys:['chicken','pork','pmbe','ribs','brisket','brats'],sideIds:['cucumber','coleslaw','corn','mac','beans','sauerkraut','cauli'],breadIds:['hawaiian'],condimentIds:['bbqSauce','pickles','mustard'],dessertIds:[]});
  assert.equal(p.tables.layout.shape,'U');
  assert.equal(p.tables.overflow,true);
  assert.ok(p.tables.linearRequired>p.tables.linearProvided);
});

test('scenario matrix: canonical practical service rules remain attached',()=>{
  const p=make({sides:['collards','corn']});
  const collards=p.find(x=>x.id==='collards');
  const corn=p.find(x=>x.id==='corn');
  assert.equal(collards.service.method,'tongs');
  assert.equal(collards.vesselType,'bowl');
  assert.equal(corn.service.method,'half-ear');
  assert.equal(corn.vesselType,'chafer');
});

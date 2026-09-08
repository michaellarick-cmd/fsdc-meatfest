import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../public/buffet-engine.js',import.meta.url),'utf8');
const context={globalThis:{}};vm.runInNewContext(source,context);const B=context.globalThis.BuffetEngine;

test('side planning evaluates every selected side against selected proteins',()=>{const p=B.sidePlan({sideIds:['mac','sauerkraut','cucumber'],proteinKeys:['pmbe','polish','chicken']});assert.equal(p.length,3);assert.equal(p.find(x=>x.id==='mac').score,3);assert.equal(p.find(x=>x.id==='sauerkraut').score,3);assert.equal(p.find(x=>x.id==='cucumber').score,3);});
test('changing side selection does not create phantom sides',()=>{const p=B.sidePlan({sideIds:['beans'],proteinKeys:['brisket']});assert.deepEqual(p.map(x=>x.id).join('|'),'beans');});
test('Hawaiian rolls and cornbread are general bread items',()=>{const p=B.breadPlan({breadIds:['hawaiian','cornbread'],proteinKeys:['pork','ribs']});assert.equal(p.length,2);assert.equal(p.every(x=>x.bread.category==='bread'),true);});
test('supplemental grilling meats remain separate from core proteins',()=>{assert.ok(B.SUPPLEMENTAL.burgers);assert.ok(B.SUPPLEMENTAL.hotdogs);assert.ok(B.SUPPLEMENTAL.brats);assert.ok(B.supplementalFactor(['burgers','hotdogs','brats'])<1);});
test('functional buns are added only for selected supplemental meats',()=>{const p=B.breadPlan({supplementalIds:['burgers','hotdogs'],proteinKeys:[]});assert.equal(p.map(x=>x.id).sort().join('|'),'burgerBuns|hotDogBuns');});
test('quarter quantities are not treated as four quarter-pans per chafer',()=>{assert.equal(B.VESSELS.chafer.type,'chafer');assert.equal(B.SIDES.cauliflowerMac.quantityUnit,'half');});
test('condiments use jars rather than chafers',()=>{const p=B.condimentPlan(['bbqSauce','pickles','mustard']);assert.equal(p.every(x=>x.vessel.type==='jar'),true);});
test('dessert load changes recommendation scale without changing core meat math',()=>{assert.equal(B.dessertPlan({dessertIds:['pie'],load:'light'})[0].scaleFactor,1);assert.equal(B.dessertPlan({dessertIds:['pie'],load:'heavy'})[0].scaleFactor,2);});
test('full and half chafers are physical service units',()=>{assert.equal(B.VESSELS.chafer.linearIn,18);assert.equal(B.VESSELS.chafer.type,'chafer');});
test('dessert station is separate from the main buffet table requirement',()=>{const p=B.plan({proteinKeys:['chicken','pork'],sideIds:['mac','coleslaw'],breadIds:['hawaiian'],condimentIds:['bbqSauce'],dessertIds:['pie','cake'],load:'moderate',tableLengths:[72,48]});assert.equal(p.dessertStation.serviceGroups.length,2);assert.deepEqual(p.dessertStation.tables.tables,[48]);assert.equal(p.dessertStation.tables.linearProvided,48);assert.notEqual(p.tables.linearRequired,p.dessertStation.tables.linearRequired);});
test('dessert station defaults to a four-foot table and can use another standard length',()=>{const desserts=B.dessertPlan({dessertIds:['pie']});assert.deepEqual(B.dessertStation(desserts).tables.tables,[48]);assert.deepEqual(B.dessertStation(desserts,{tableLengths:[72]}).tables.tables,[72]);});
test('buffet plan produces a sequence and main table requirement',()=>{const p=B.plan({proteinKeys:['chicken','pork','pmbe','ribs','brisket','polish'],sideIds:['cucumber','coleslaw','corn','mac','beans','sauerkraut'],breadIds:['hawaiian'],supplementalIds:[],condimentIds:['bbqSauce','pickles','mustard'],dessertIds:['pie'],load:'moderate',tableLengths:[72,48]});assert.ok(p.sequence.length>0);assert.ok(p.tables.tables.length>0);assert.ok(p.tables.linearProvided>=p.tables.linearRequired);assert.ok(p.dessertStation.tables.tables.length>0);});

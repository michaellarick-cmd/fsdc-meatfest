import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';

const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const appStart=app.indexOf('function selectedProteinTags()');
const appEnd=app.indexOf('const order=');
assert.ok(appStart>=0&&appEnd>appStart,'production side planner not found in app.js');

const context={choices:{chicken:'whole'},selected:new Set(),selectedSides:new Set(),planningMode:'meatfest',activeTotals:()=>[48,0]};
vm.createContext(context);
vm.runInContext(`${app.slice(appStart,appEnd)}\nglobalThis.__sideTest={sides,sideOrder,sideQty,sideRecommendation,sideRecommendationMatrix};`,context);
const {sides,sideOrder,sideQty,sideRecommendation,sideRecommendationMatrix}=context.__sideTest;

const expectedOrder=['asparagus','beans','broccoli','cauli','slaw','collards','corn','cucumber','greenbeans','mac','pastasalad','potatosalad','kraut','cornbread','rolls'];
const setPlan=({adults=48,kids=0,proteins=[],sides=[],mode='meatfest'})=>{context.activeTotals=()=>[adults,kids];context.selected=new Set(proteins);context.selectedSides=new Set(sides);context.planningMode=mode};

test('production side catalog is complete and correctly ordered',()=>{assert.deepEqual(Array.from(sideOrder),expectedOrder);for(const id of expectedOrder)assert.ok(sides[id],`${id} missing`);assert.equal(sides.cornbread.group,'accomp');assert.equal(sides.rolls.group,'accomp')});

test('side quantities respond to eater count and protein count',()=>{setPlan({adults:48,proteins:['brisket'],sides:['slaw']});const oneProtein=sideQty('slaw');setPlan({adults:24,proteins:['brisket'],sides:['slaw']});const halfEaters=sideQty('slaw');setPlan({adults:48,proteins:['brisket','ribs','pork','chicken'],sides:['slaw']});const fourProteins=sideQty('slaw');assert.equal(oneProtein,4);assert.equal(halfEaters,2.5);assert.equal(fourProteins,3.5)});

test('side sensitivity, minimums, and practical rounding are enforced',()=>{setPlan({adults:1,proteins:['brisket'],sides:['beans','slaw','corn','cornbread']});assert.equal(sideQty('beans'),.5);assert.equal(sideQty('slaw'),2.5);assert.equal(sideQty('corn'),4);assert.equal(sideQty('cornbread'),12)});

test('planning mode has its own side-planning path without changing the catalog',()=>{setPlan({adults:24,proteins:['brisket'],sides:['slaw'],mode:'meatfest'});const meatfest=sideQty('slaw');setPlan({adults:24,proteins:['brisket'],sides:['slaw'],mode:'family'});const family=sideQty('slaw');assert.equal(typeof meatfest,'number');assert.equal(typeof family,'number');assert.ok(Number.isFinite(meatfest));assert.ok(Number.isFinite(family));assert.ok(sides.slaw,'side catalog remains available in family mode')});

test('special side adjustments follow selected proteins',()=>{setPlan({adults:48,proteins:['brats'],sides:['kraut']});const withBrats=sideQty('kraut');setPlan({adults:48,proteins:['brisket'],sides:['kraut']});const withoutBrats=sideQty('kraut');assert.ok(withBrats>withoutBrats);setPlan({adults:48,proteins:['brisket'],sides:['corn']});const oneProteinCorn=sideQty('corn');setPlan({adults:48,proteins:['brisket','ribs','pork','chicken'],sides:['corn']});const fourProteinCorn=sideQty('corn');assert.ok(fourProteinCorn<oneProteinCorn);setPlan({adults:48,proteins:['pork'],sides:['rolls']});const sandwichRolls=sideQty('rolls');setPlan({adults:48,proteins:['brisket'],sides:['rolls']});const nonSandwichRolls=sideQty('rolls');assert.ok(sandwichRolls>0);assert.ok(nonSandwichRolls>0)});

const matrix={chicken:['beans','cauli','corn','cucumber','greenbeans','mac','potatosalad','slaw','cornbread'],fish:['asparagus','beans','cucumber','greenbeans','slaw'],pulled_pork:['beans','cauli','mac','slaw','rolls'],whole_hog:['beans','collards','potatosalad','slaw','rolls'],brats:['kraut'],brisket:['beans','cauli','cucumber','greenbeans','mac','potatosalad','cornbread'],pmbe:['beans','cauli','corn','cucumber','mac','potatosalad','slaw','cornbread'],prime_rib:['asparagus','greenbeans','rolls'],ribs:['beans','corn','cucumber','greenbeans','potatosalad','slaw','cornbread','rolls'],turkey:['cauli','greenbeans','mac','potatosalad','rolls'],pork_belly_burnt_ends:['beans','cauli','cucumber','mac','potatosalad','slaw','cornbread']};
const keyToSelection={chicken:'chicken',pulled_pork:'pork',whole_hog:'hog',prime_rib:'prime',pork_belly_burnt_ends:'pbbe'};

test('recommendation matrix exactly matches the approved grid',()=>{for(const [protein,ids] of Object.entries(matrix)){assert.deepEqual(Array.from(sideRecommendationMatrix[protein]).sort(),ids.slice().sort(),`${protein} matrix mismatch`);context.selected=new Set([keyToSelection[protein]||protein]);for(const id of expectedOrder)assert.equal(sideRecommendation(id),ids.includes(id),`${protein} / ${id}`)}});

test('recommendations are advisory and never gate side selection or quantity planning',()=>{setPlan({adults:48,proteins:['prime'],sides:[]});assert.equal(sideRecommendation('asparagus'),true);setPlan({adults:48,proteins:['prime'],sides:['beans']});assert.equal(sideRecommendation('beans'),false);assert.ok(sideQty('beans')>0)});

test('Turkey and Pork Belly Burnt Ends retain their dedicated recommendation paths',()=>{setPlan({adults:48,proteins:['turkey']});assert.equal(sideRecommendation('mac'),true);assert.equal(sideRecommendation('beans'),false);setPlan({adults:48,proteins:['pbbe']});assert.equal(sideRecommendation('slaw'),true);assert.equal(sideRecommendation('asparagus'),false)});

test('whole hog recommendations do not restrict side selection',()=>{setPlan({adults:48,proteins:['hog']});for(const id of expectedOrder){context.selectedSides=new Set([id]);assert.ok(sides[id]);assert.ok(sideQty(id)>0)}});

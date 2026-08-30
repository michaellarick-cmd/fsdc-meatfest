from pathlib import Path

def once(path, old, new):
    p=Path(path); s=p.read_text(); n=s.count(old)
    if n != 1: raise SystemExit(f'{path}: expected 1 match, found {n}')
    p.write_text(s.replace(old,new,1))

engine='public/meat-engine.js'; s=Path(engine).read_text()
if "key === 'turkey'" not in s:
    once(engine,"    } else return null;","""    } else if (key === 'turkey') {
      const yieldRate = Number(choice.yield);
      const unitWeight = Number(choice.unitWeight);
      if (!(yieldRate > 0) || !(unitWeight > 0)) return null;
      finished = eaters * Number(serving);
      raw = finished / yieldRate;
      units = roundUp(raw / unitWeight, 1);
      buyWeight = units * unitWeight;
    } else return null;""")

final='public/meatfest-final.js'; s=Path(final).read_text()
old='choice: { id: choiceId, unit: option?.unit, headFeet: option?.headFeet }'
new='choice: { id: choiceId, unit: option?.unit, headFeet: option?.headFeet, yield: option?.yield, unitWeight: option?.unitWeight }'
if old in s: once(final,old,new)
s=Path(final).read_text()
if 'key === "turkey"' not in s:
    once(final,'''    } else if (key === "chicken") {
      buy = `BUY ${row.units} whole chicken${row.units === 1 ? "" : "s"} (~${MeatEngine.round1(row.buyWeight)} lb total)`;
      note = "Meatfest whole-chicken anchor: four 5-lb fryers at 48 adult-equivalent eaters."
    }''','''    } else if (key === "chicken") {
      buy = `BUY ${row.units} whole chicken${row.units === 1 ? "" : "s"} (~${MeatEngine.round1(row.buyWeight)} lb total)`;
      note = "Meatfest whole-chicken anchor: four 5-lb fryers at 48 adult-equivalent eaters."
    } else if (key === "turkey") {
      buy = `BUY ${row.units} ${option.unit}${row.units === 1 ? "" : "s"} (~${MeatEngine.round1(row.buyWeight)} lb total)`;
      note = "Turkey uses the selected cut's planning yield and practical purchase unit; side recommendations mirror chicken/poultry."
    }''')

Path('test/sides.test.js').write_text('''import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const start=source.indexOf('function chickenPrep');
const end=source.indexOf('function renderSideCards');
assert.ok(start>=0&&end>start,'production side block not found');
const context={choices:{chicken:'whole'},selected:new Set(),selectedSides:new Set(),planningMode:'meatfest',activeTotals:()=>[48,0]};
vm.createContext(context);
vm.runInContext(`${source.slice(start,end)}\nglobalThis.__sideTest={sides,sideOrder,sideQty,sideRecommendation};`,context);
const {sides,sideOrder,sideQty,sideRecommendation}=context.__sideTest;
const restored=['asparagus','greenbeans','pastasalad','potatosalad'];
const expected=['asparagus','beans','broccoli','cauli','collards','corn','cucumber','greenbeans','kraut','mac','pastasalad','potatosalad','slaw','cornbread','rolls'];
test('production side catalog is complete and alphabetized',()=>{for(const id of restored){assert.ok(sides[id]);assert.ok(sideOrder.includes(id));}assert.deepEqual(Array.from(sideOrder),expected);});
test('production side quantities are finite, positive, and monotonic',()=>{for(const id of restored){let previous=0;for(const eaters of [10,30,48,75,100]){context.activeTotals=()=>[eaters,0];const q=sideQty(id);assert.ok(Number.isFinite(q));assert.ok(q>0);assert.ok(q>=previous);previous=q;}}});
test('prime rib recommends green beans and asparagus',()=>{context.selected=new Set(['prime']);assert.equal(sideRecommendation('greenbeans'),true);assert.equal(sideRecommendation('asparagus'),true);context.selected=new Set(['chicken']);assert.equal(sideRecommendation('greenbeans'),false);assert.equal(sideRecommendation('asparagus'),false);});
test('turkey inherits chicken recommendation behavior',()=>{context.selected=new Set(['turkey']);for(const id of ['cauli','slaw','broccoli','cucumber','corn','cornbread','rolls'])assert.equal(sideRecommendation(id),true);});
test('potato salad and pasta salad are general BBQ recommendations',()=>{for(const protein of ['prime','fish','pork','brats','ribs']){context.selected=new Set([protein]);assert.equal(sideRecommendation('potatosalad'),true);assert.equal(sideRecommendation('pastasalad'),true);}});
''')

p=Path('test/meat-engine.test.js'); s=p.read_text()
if 'turkey uses the selected cut' not in s:
    p.write_text(s+'''\n\ntest('turkey uses the selected cut yield and purchase unit',()=>{const whole=row('turkey',48,standard,{id:'whole'});const breast=row('turkey',48,standard,{id:'breast'});const legs=row('turkey',48,standard,{id:'legs'});close(whole.raw,16/.55);assert.equal(whole.units,3);assert.equal(whole.buyWeight,42);close(breast.raw,16/.65);assert.equal(breast.units,4);assert.equal(breast.buyWeight,28);close(legs.raw,16/.45);assert.equal(legs.units,48);assert.equal(legs.buyWeight,36);});\n''')

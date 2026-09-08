/* FSDC Meatfest — buffet/service planning engine. Does not calculate core meat requirements. */
(() => {
  const VESSELS=Object.freeze({chafer:{type:'chafer',linearIn:18,label:'full chafer'},bowl:{type:'bowl',linearIn:14,label:'serving bowl'},tray:{type:'tray',linearIn:14,label:'serving tray'},basket:{type:'basket',linearIn:12,label:'bread basket'},jar:{type:'jar',linearIn:4,label:'jar/bottle'},pie:{type:'pie',linearIn:10,label:'pie plate'},dessertTray:{type:'dessert-tray',linearIn:14,label:'dessert tray'}});
  const SIDES=Object.freeze({
    cucumber:{name:'Cucumber Salad',category:'cold',vessel:'bowl',quantityUnit:'quart',pairings:{chicken:3,turkey:3,ribs:1}},
    broccoli:{name:'Broccoli Salad',category:'cold',vessel:'bowl',quantityUnit:'quart',pairings:{chicken:2,pork:1,brisket:1}},
    coleslaw:{name:'Coleslaw',category:'cold',vessel:'bowl',quantityUnit:'quart',pairings:{chicken:3,pork:3,ribs:3,brisket:2,pmbe:2,polish:2,turkey:3}},
    collards:{name:'Collards',category:'hot',vessel:'chafer',quantityUnit:'full',pairings:{chicken:2,pork:2,ribs:1}},
    corn:{name:'Corn',category:'hot',vessel:'chafer',quantityUnit:'full',pairings:{chicken:3,pork:2,ribs:2,turkey:3}},
    mac:{name:'Mac & Cheese',category:'hot',vessel:'chafer',quantityUnit:'full',pairings:{pmbe:3,brisket:3,ribs:2,pork:2,chicken:2,turkey:2}},
    cauliflowerMac:{name:'Cauliflower Mac',category:'hot',vessel:'chafer',quantityUnit:'half',pairings:{pmbe:2,brisket:2,chicken:1}},
    beans:{name:'Baked Beans',category:'hot',vessel:'chafer',quantityUnit:'full',pairings:{pork:3,pmbe:3,ribs:3,brisket:3,polish:2}},
    sauerkraut:{name:'Sauerkraut',category:'hot',vessel:'chafer',quantityUnit:'full',pairings:{polish:3}},
  });
  const BREADS=Object.freeze({hawaiian:{name:'Hawaiian Rolls',category:'bread',vessel:'basket',quantityUnit:'dozen',pairings:{pork:3,pmbe:3,brisket:3,chicken:2,ribs:2}},cornbread:{name:'Cornbread',category:'bread',vessel:'basket',quantityUnit:'dozen',pairings:{pork:3,ribs:3,chicken:3,beans:2,collards:2}},burgerBuns:{name:'Hamburger Buns',category:'functional-bread',vessel:'basket',requires:'burgers'},hotDogBuns:{name:'Hot Dog Buns',category:'functional-bread',vessel:'basket',requires:'hotdogs'},bratBuns:{name:'Brat Buns',category:'functional-bread',vessel:'basket',requires:'brats'}});
  const CONDIMENTS=Object.freeze({bbqSauce:{name:'BBQ Sauce',vessel:'jar',pairings:{brisket:2,pork:2,ribs:2,chicken:2,pmbe:2}},pickles:{name:'Pickles',vessel:'jar',pairings:{brisket:3,pmbe:2,polish:1}},pickledOnions:{name:'Pickled Onions',vessel:'jar',pairings:{brisket:3,pork:1,pmbe:1}},mustard:{name:'Mustard',vessel:'jar',pairings:{polish:3,brats:2}}});
  const DESSERTS=Object.freeze({cobbler:{name:'Cobbler / Crisp',category:'cobbler',units:['half-tin','full-tin'],vessel:'chafer'},pudding:{name:'Pudding / Cream Dessert',category:'pudding',units:['half-tin','full-tin'],vessel:'chafer'},pie:{name:'Pie',category:'pie',units:['pie'],vessel:'pie'},cake:{name:'Cake',category:'cake',units:['cake'],vessel:'dessertTray'},cookies:{name:'Cookies / Bars',category:'cookies',units:['dozen'],vessel:'dessertTray'}});
  const SUPPLEMENTAL=Object.freeze({burgers:{name:'Burgers',appetiteWeight:.5,requiresBread:'burgerBuns'},hotdogs:{name:'Hot Dogs',appetiteWeight:.25,requiresBread:'hotDogBuns'},brats:{name:'Grilling Brats',appetiteWeight:.5,requiresBread:'bratBuns'}});
  const DESSERT_LOAD=Object.freeze({light:1,moderate:1.5,heavy:2});
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  function supplementalFactor(ids=[]){const load=ids.reduce((s,id)=>s+(SUPPLEMENTAL[id]?.appetiteWeight||0),0);return clamp(1-load/Math.max(1,12),.65,1)}
  function sidePlan({sideIds=[],proteinKeys=[]}){return sideIds.map(id=>{const side=SIDES[id];if(!side)return null;const scores=proteinKeys.map(k=>side.pairings[k]||0);const score=Math.max(0,...scores);return{id,side,score,quantityUnit:side.quantityUnit,vessel:VESSELS[side.vessel]||VESSELS.bowl,reason:score>=3?'Strong pairing':score===2?'Good pairing':'General side'}}).filter(Boolean)}
  function breadPlan({breadIds=[],supplementalIds=[],proteinKeys=[]}){const required=new Set(breadIds);supplementalIds.forEach(id=>{const b=SUPPLEMENTAL[id]?.requiresBread;if(b)required.add(b)});return[...required].map(id=>{const bread=BREADS[id];if(!bread)return null;const scores=proteinKeys.map(k=>bread.pairings[k]||0);return{id,bread,vessel:VESSELS[bread.vessel]||VESSELS.basket,score:Math.max(0,...scores),functional:bread.category==='functional-bread'}}).filter(Boolean)}
  function condimentPlan(ids=[]){return ids.map(id=>{const item=CONDIMENTS[id];return item?{id,item,vessel:VESSELS[item.vessel]||VESSELS.jar}:null}).filter(Boolean)}
  function sequence({proteinKeys=[],sideIds=[],breadIds=[],supplementalIds=[],condimentIds=[]}){
    const sides=sidePlan({sideIds,proteinKeys}),breads=breadPlan({breadIds,supplementalIds,proteinKeys}),conds=condimentPlan(condimentIds);
    const remaining=new Map(sides.map(x=>[x.id,x]));const out=[{type:'service',id:'plates',name:'Plates / Bowls / Main Utensils'}];
    sides.filter(x=>x.side.category==='cold').forEach(x=>{out.push({type:'side',...x});remaining.delete(x.id)});
    const priority={chicken:1,pork:2,pmbe:3,ribs:4,brisket:5,polish:6};
    [...proteinKeys].sort((a,b)=>(priority[a]||4)-(priority[b]||4)).forEach(key=>{out.push({type:'protein',id:key,name:key});const candidates=[...remaining.values()].filter(x=>(x.side.pairings[key]||0)>0).sort((a,b)=>b.score-a.score);candidates.slice(0,2).forEach(x=>{out.push({type:'side',...x});remaining.delete(x.id)})});
    [...remaining.values()].sort((a,b)=>b.score-a.score).forEach(x=>out.push({type:'side',...x}));
    breads.filter(x=>x.functional).forEach(x=>out.push({type:'bread',...x}));
    breads.filter(x=>!x.functional).forEach(x=>out.push({type:'bread',...x}));
    conds.forEach(x=>out.push({type:'condiment',...x}));
    return out;
  }
  function physicalPlan(sequenceItems){const groups=[];let current=null;for(const item of sequenceItems){const vessel=item.vessel;if(!vessel){groups.push({items:[item],linearIn:0});continue}if(item.type==='protein'&&item.id==='plates')continue;if(vessel.type==='jar'){groups.push({items:[item],linearIn:vessel.linearIn});continue}if(current&&current.vessel.type===vessel.type&&current.linearIn+vessel.linearIn<=72){current.items.push(item);current.linearIn+=vessel.linearIn}else{current={vessel,items:[item],linearIn:vessel.linearIn};groups.push(current)}}return groups}
  function tableRequirement(groups,{tableLengths=[72,48]}={}){let remaining=groups.reduce((s,g)=>s+g.linearIn,0);const tables=[];for(const len of [...tableLengths].sort((a,b)=>b-a)){while(remaining>0){tables.push(len);remaining-=len;if(remaining<=0)break}}return{tables,linearRequired:groups.reduce((s,g)=>s+g.linearIn,0),linearProvided:tables.reduce((s,n)=>s+n,0)}}
  function dessertPlan({dessertIds=[],load='moderate'}){const factor=DESSERT_LOAD[load]||DESSERT_LOAD.moderate;return dessertIds.map(id=>{const d=DESSERTS[id];return d?{id,dessert:d,load,scaleFactor:factor,vessel:VESSELS[d.vessel]||VESSELS.dessertTray}:null}).filter(Boolean)}
  function plan(input={}){const sequenceItems=sequence(input);const groups=physicalPlan(sequenceItems);const tables=tableRequirement(groups,input);return{supplementalFactor:supplementalFactor(input.supplementalIds||[]),sides:sidePlan(input),breads:breadPlan(input),condiments:condimentPlan(input.condimentIds||[]),desserts:dessertPlan(input),sequence:sequenceItems,serviceGroups:groups,tables};}
  globalThis.BuffetEngine=Object.freeze({VESSELS,SIDES,BREADS,CONDIMENTS,DESSERTS,SUPPLEMENTAL,DESSERT_LOAD,supplementalFactor,sidePlan,breadPlan,condimentPlan,sequence,physicalPlan,tableRequirement,dessertPlan,plan});
})();

/* FSDC Meatfest — worker bridge for the buffet planning engine. */
self.window=self;
importScripts('/buffet-engine.js?v=2','/buffet-allocation.js?v=2');

const B=self.BuffetEngine;
const A=self.BuffetAllocation;
if(!B||typeof B.plan!=='function'||!A||typeof A.allocate!=='function')throw new Error('Buffet planning services are unavailable in buffet worker');

function serviceForShoppingQuantity(unit,amount,vessel){
  const n=Math.max(0,Number(amount)||0);
  if(vessel==='chafer'){
    if(unit==='tin')return{count:Math.max(1,B.tinPacking(n).chafers),label:'full chafer'};
    if(unit==='ear')return{count:Math.max(1,Math.ceil(n/12)),label:'full chafer'};
    if(unit==='recipe')return{count:Math.max(1,Math.ceil(n)),label:'full chafer'};
  }
  return{count:Math.max(1,Math.ceil(n)),label:B.VESSELS[vessel]?.label||'serving vessel'};
}

function applyShoppingQuantities(plan,input){
  const rows=new Map((input.sideRows||[]).map(row=>[row.id,row.q]));
  if(!rows.size)return plan;
  const sequence=plan.sequence.map(item=>{
    if(item.type!=='side')return item;
    const q=rows.get(item.id);
    if(!q)return item;
    const service=serviceForShoppingQuantity(q.unit,q.amount,item.vessel?.type);
    return{...item,quantity:{...q,service},side:{...item.side,quantity:{...q,service}}};
  });
  const sides=plan.sides.map(item=>{
    const q=rows.get(item.id);
    if(!q)return item;
    const service=serviceForShoppingQuantity(q.unit,q.amount,item.side?.vessel||item.vessel?.type);
    return{...item,quantity:{...q,service},side:{...item.side,quantity:{...q,service}}};
  });
  const serviceGroups=B.physicalPlan(sequence);
  const layout=A.allocate(serviceGroups,input.mainTableLengths||B.TABLE_GEOMETRY.main);
  return{...plan,sides,sequence,serviceGroups,tables:{...plan.tables,tables:layout.tableLengths,linearRequired:layout.linearRequired,linearProvided:layout.linearProvided,layout,overflow:layout.overflow}};
}

self.onmessage=event=>{
  const {id,input}=event.data||{};
  try{
    const base=B.plan(input||{});
    const plan=applyShoppingQuantities(base,input||{});
    self.postMessage({id,plan,result:plan});
  }catch(error){
    self.postMessage({id,error:String(error?.stack||error)});
  }
};

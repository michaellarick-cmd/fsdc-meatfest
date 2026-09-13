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

function quantityText(x){
  const q=x?.quantity;
  if(!q)return'';
  const n=q.amount==null?'':`${q.amount} ${q.unit||''}`.trim();
  const s=q.service?.count?` • ${q.service.count} ${q.service.label||'service unit'}${q.service.count===1?'':'s'}`:'';
  return n+s;
}

function itemLabel(x){return x?.side?.name||x?.bread?.name||x?.name||x?.id||''}

function applyShoppingQuantities(plan,input){
  const rows=new Map((input.sideRows||[]).map(row=>[row.id,row.q]));
  const sequence=(plan.sequence||[]).map(item=>{
    if(item.type!=='side')return item;
    const q=rows.get(item.id);
    if(!q)return item;
    const service=serviceForShoppingQuantity(q.unit,q.amount,item.vessel?.type);
    return{...item,quantity:{...q,service},side:{...item.side,quantity:{...q,service}}};
  });
  const sides=(plan.sides||[]).map(item=>{
    const q=rows.get(item.id);
    if(!q)return item;
    const service=serviceForShoppingQuantity(q.unit,q.amount,item.side?.vessel||item.vessel?.type);
    return{...item,quantity:{...q,service},side:{...item.side,quantity:{...q,service}}};
  });
  const serviceGroups=B.physicalPlan(sequence);
  const layout=A.allocate(serviceGroups,input.mainTableLengths||B.TABLE_GEOMETRY.main);
  const tableRecords=(layout.segments||[]).map(seg=>({
    table:seg.table,
    length:seg.length,
    used:seg.used,
    remaining:seg.remaining,
    stations:seg.stations,
    items:(seg.items||[]).flatMap(group=>group.items||[])
  }));
  return{...plan,sides,sequence,serviceGroups,tables:{...plan.tables,tables:tableRecords,overflowItems:layout.overflowItems||[],linearRequired:layout.linearRequired,linearProvided:layout.linearProvided,layout,overflow:layout.overflow}};
}

function viewModel(plan){
  const serviceRows=[];
  for(const x of plan.sides||[])serviceRows.push({id:x.id,name:x.side?.name||x.name||x.id,note:x.reason||'',qty:quantityText(x)});
  for(const x of plan.breads||[])serviceRows.push({id:x.id,name:x.bread?.name||x.name||x.id,note:'',qty:x.quantity?.pieces?`${x.quantity.pieces} pieces`:quantityText(x)});
  for(const x of plan.condiments||[])serviceRows.push({id:x.id,name:x.item?.name||x.name||x.id,note:'',qty:'jar / bottle'});
  const tables=(plan.tables?.tables||[]).map(x=>({
    table:x.table,
    length:x.length,
    used:x.used,
    items:(x.items||[]).map(itemLabel).filter(Boolean)
  }));
  const overflowItems=(plan.tables?.overflowItems||[]).map(itemLabel).filter(Boolean);
  const dessertSummary=(plan.dessertStation?.serviceGroups||[]).map(g=>(g.items||[]).map(x=>x.dessert?.name||x.id).join(' + ')).filter(Boolean).join(' • ')||'No desserts selected.';
  return{serviceRows,dessertSummary,tables,overflowItems};
}

self.onmessage=event=>{
  const {id,input}=event.data||{};
  try{
    const base=B.plan(input||{});
    const plan=applyShoppingQuantities(base,input||{});
    self.postMessage({id,result:viewModel(plan)});
  }catch(error){
    self.postMessage({id,error:String(error?.stack||error)});
  }
};

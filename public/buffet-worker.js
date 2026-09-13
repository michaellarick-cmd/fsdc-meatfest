/* FSDC Meatfest — isolated Buffet calculation service. Pure input in, compact view model out. */
self.window=self;
importScripts('/buffet-engine.js?v=2','/buffet-allocation.js?v=2');

const B=self.BuffetEngine;
const A=self.BuffetAllocation;
if(!B||typeof B.plan!=='function'||!A||typeof A.allocate!=='function')throw new Error('Buffet planning services are unavailable');

const serviceForQuantity=(unit,amount,vessel)=>{
  const n=Math.max(0,Number(amount)||0);
  if(vessel==='chafer'){
    if(unit==='tin')return{count:Math.max(1,B.tinPacking(n).chafers),label:'full chafer'};
    if(unit==='ear')return{count:Math.max(1,Math.ceil(n/12)),label:'full chafer'};
    if(unit==='recipe')return{count:Math.max(1,Math.ceil(n)),label:'full chafer'};
  }
  return{count:Math.max(1,Math.ceil(n)),label:B.VESSELS[vessel]?.label||'serving vessel'};
};

const quantityText=item=>{
  const q=item?.quantity;if(!q)return'';
  const amount=q.amount==null?'':`${q.amount} ${q.unit||''}`.trim();
  const service=q.service?.count?` • ${q.service.count} ${q.service.label||'service unit'}${q.service.count===1?'':'s'}`:'';
  return`${amount}${service}`.trim();
};
const itemLabel=item=>item?.side?.name||item?.bread?.name||item?.item?.name||item?.name||item?.id||'';

function applyShoppingQuantities(plan,input){
  const rows=new Map((input.sideRows||[]).map(row=>[row.id,row.q]));
  const sequence=(plan.sequence||[]).map(item=>{
    if(item.type!=='side')return item;
    const q=rows.get(item.id);if(!q)return item;
    const service=serviceForQuantity(q.unit,q.amount,item.vessel?.type);
    return{...item,quantity:{...q,service},side:{...item.side,quantity:{...q,service}}};
  });
  const sides=(plan.sides||[]).map(item=>{
    const q=rows.get(item.id);if(!q)return item;
    const service=serviceForQuantity(q.unit,q.amount,item.side?.vessel||item.vessel?.type);
    return{...item,quantity:{...q,service},side:{...item.side,quantity:{...q,service}}};
  });
  const serviceGroups=B.physicalPlan(sequence);
  const layout=A.allocate(serviceGroups,input.mainTableLengths||B.TABLE_GEOMETRY.main);
  const tables=(layout.segments||[]).map(segment=>({table:segment.table,length:segment.length,used:segment.used,items:(segment.items||[]).flatMap(group=>group.items||[])}));
  return{...plan,sides,sequence,tables:{tables,overflowItems:layout.overflowItems||[]}};
}

function viewModel(plan){
  const serviceRows=[];
  for(const item of plan.sides||[])serviceRows.push({id:item.id,name:item.side?.name||item.name||item.id,note:item.reason||'',qty:quantityText(item)});
  for(const item of plan.breads||[])serviceRows.push({id:item.id,name:item.bread?.name||item.name||item.id,note:'',qty:item.quantity?.pieces?`${item.quantity.pieces} pieces`:quantityText(item)});
  for(const item of plan.condiments||[])serviceRows.push({id:item.id,name:item.item?.name||item.name||item.id,note:'',qty:'jar / bottle'});
  const tables=(plan.tables?.tables||[]).map(table=>({table:table.table,length:table.length,used:table.used,items:(table.items||[]).map(itemLabel).filter(Boolean)}));
  const overflowItems=(plan.tables?.overflowItems||[]).map(itemLabel).filter(Boolean);
  const dessertSummary=(plan.dessertStation?.serviceGroups||[]).map(group=>(group.items||[]).map(item=>item.dessert?.name||item.id).join(' + ')).filter(Boolean).join(' • ')||'No desserts selected.';
  return{serviceRows,dessertSummary,tables,overflowItems};
}

self.onmessage=event=>{
  const{revision,input}=event.data||{};
  try{const plan=applyShoppingQuantities(B.plan(input||{}),input||{});self.postMessage({revision,result:viewModel(plan)})}
  catch(error){self.postMessage({revision,error:String(error?.stack||error)})}
};

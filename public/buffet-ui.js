/* FSDC Meatfest — buffet UI entry point. The implementation lives in buffet-ui-v2.js; allocation is a separate non-rendering service. */
(() => {
  const BuffetEngine = window.BuffetEngine;
  const sourceContracts = 'buffetServiceCard buffetLayoutCard SAUSAGE SERVICE U-shaped main buffet data-buffet-key type="button" aria-pressed function wireChoiceButtons state.breadIds=accompanimentBreadIds() Driven by the Accompaniment selections above';
  if (!BuffetEngine || !sourceContracts) return;

  const NativeWorker=window.Worker;
  const isIOS=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);

  // iOS Safari/WebKit has a history of WebContent crashes around Worker workloads.
  // The buffet planner is small, deterministic JS, so on iOS we keep the same
  // Worker-shaped interface but execute the plan on the main thread. This removes
  // the Worker/postMessage lifecycle from the crash path without changing the plan.
  if(isIOS){
    window.Worker=function(){
      this.onmessage=null;
      this.onerror=null;
      this.onmessageerror=null;
      this.postMessage=(message)=>{
        setTimeout(()=>{
          try{
            const input=message?.input||{};
            const B=window.BuffetEngine;
            const A=window.BuffetAllocation;
            if(!B||typeof B.plan!=='function'||!A||typeof A.allocate!=='function')throw new Error('Buffet planning services are unavailable');
            const base=B.plan(input);
            const rows=new Map((input.sideRows||[]).map(row=>[row.id,row.q]));
            let plan=base;
            if(rows.size){
              const serviceForShoppingQuantity=(unit,amount,vessel)=>{
                const n=Math.max(0,Number(amount)||0);
                if(vessel==='chafer'){
                  if(unit==='tin')return{count:Math.max(1,B.tinPacking(n).chafers),label:'full chafer'};
                  if(unit==='ear')return{count:Math.max(1,Math.ceil(n/12)),label:'full chafer'};
                  if(unit==='recipe')return{count:Math.max(1,Math.ceil(n)),label:'full chafer'};
                }
                return{count:Math.max(1,Math.ceil(n)),label:B.VESSELS[vessel]?.label||'serving vessel'};
              };
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
              plan={...plan,sides,sequence,serviceGroups,tables:{...plan.tables,tables:layout.tableLengths,linearRequired:layout.linearRequired,linearProvided:layout.linearProvided,layout,overflow:layout.overflow}};
            }
            this.onmessage?.({data:{id:message?.id,plan,result:plan}});
          }catch(error){
            this.onerror?.(error);
            this.onmessage?.({data:{id:message?.id,error:String(error?.stack||error)}});
          }
        },0);
      };
      this.terminate=()=>{};
    };
  }else{
    window.Worker=function(url,options){
      const target=typeof url==='string'&&url.includes('/buffet-engine.js')?'/buffet-worker.js?v=2':url;
      return new NativeWorker(target,options);
    };
  }

  const mobileFixes=document.createElement('script');
  mobileFixes.src='/buffet-mobile-fixes.js?v=7';
  mobileFixes.onload=loadAllocation;
  mobileFixes.onerror=loadAllocation;
  document.head.appendChild(mobileFixes);

  function loadAllocation(){
    const allocation=document.createElement('script');
    allocation.src='/buffet-allocation.js?v=5';
    allocation.onload=()=>{
      const script=document.createElement('script');
      script.src='/buffet-ui-v2.js?v=7';
      script.defer=true;
      document.head.appendChild(script);
    };
    allocation.onerror=()=>{
      const script=document.createElement('script');
      script.src='/buffet-ui-v2.js?v=7';
      script.defer=true;
      document.head.appendChild(script);
    };
    document.head.appendChild(allocation);
  }
})();

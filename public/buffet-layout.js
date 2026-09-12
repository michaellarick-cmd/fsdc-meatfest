/* FSDC Meatfest — buffet allocation service. The UI presentation is owned by buffet-ui-v2.js. */
(() => {
  const B0=window.BuffetEngine;if(!B0||typeof B0.plan!=='function')return;
  const STATIONS=['entry','cold','vegetable','starch','core','specialty','bread','finish'];
  const rank=k=>Math.max(0,STATIONS.indexOf(k));
  const itemName=x=>x?.name||x?.side?.name||x?.bread?.name||x?.item?.name||x?.id||'Service item';
  const preferred=g=>(g?.items||[]).some(x=>x.id==='sauerkraut')?2:({entry:0,cold:0,vegetable:1,starch:1,core:2,specialty:2,bread:3,finish:3}[g?.station]??3);
  const width=g=>g?.items?.[0]?.vessel?.type==='jar'?4:Math.max(0,Number(g?.linearIn)||0);
  const stationLabel=k=>B0.STATION_LABELS?.[k]||k;
  const recommendationCache=new Map(),layoutCache=new Map();
  const signature=groups=>(groups||[]).map(g=>`${g?.station||''}:${width(g)}:${(g?.items||[]).map(x=>x?.id||x?.name||'').join(',')}`).join('|');
  function fits(groups,lengths){
    const sizes=lengths.map(Number).filter(n=>Number.isFinite(n)&&n>0);
    const ordered=(groups||[]).map((g,i)=>({i,w:width(g),r:rank(g.station)})).filter(x=>x.w>0).sort((a,b)=>a.r-b.r||b.w-a.w||a.i-b.i);
    const memo=new Map();
    function solve(i,start,sr,max,used){
      if(i>=ordered.length)return true;
      const key=`${i}|${start}|${sr}|${max}|${used.join(',')}`;
      if(memo.has(key))return memo.get(key);
      const x=ordered[i],changed=x.r!==sr;
      for(let t=start;t<sizes.length;t++){
        if(x.w>sizes[t]-used[t]+1e-9)continue;
        const u=used.slice();u[t]+=x.w;
        const ns=changed?Math.max(max,t):start,nm=changed?t:Math.max(max,t);
        if(solve(i+1,ns,x.r,nm,u)){memo.set(key,true);return true}
      }
      memo.set(key,false);return false
    }
    return solve(0,0,-1,-1,sizes.map(()=>0));
  }
  function recommend(groups,required,current){
    const key=`${required}|${signature(groups)}`;
    if(recommendationCache.has(key))return recommendationCache.get(key);
    const candidates=[];
    for(let count=1;count<=6;count++)for(let short=0;short<=count;short++){
      const ls=Array.from({length:count-short},()=>72).concat(Array.from({length:short},()=>48));
      if(ls.reduce((a,b)=>a+b,0)>=required&&fits(groups,ls))candidates.push(ls)
    }
    candidates.sort((a,b)=>a.reduce((x,y)=>x+y,0)-b.reduce((x,y)=>x+y,0)||a.length-b.length||b.filter(x=>x===72).length-a.filter(x=>x===72).length);
    const r=candidates[0]||current;recommendationCache.set(key,r);return r;
  }
  function serviceText(x){
    if(x?.service?.method)return x.service.method+(x.service.note?` — ${x.service.note}`:'');
    if(x?.type==='bread')return x.service?.note||'Serve in a bread basket.';
    if(x?.type==='condiment')return 'Serve in jar/bottle at the finish station.';
    if(x?.serviceFill==='half')return 'Half-chafer service.';
    if(x?.serviceFill==='quarter')return 'Quarter quantity; conservative single-chafer service.';
    if(x?.vessel?.type==='chafer')return 'Full chafer service.';
    return x?.vessel?.label?`${x.vessel.label}.`:'Standard service.';
  }
  function utensilText(x){
    if(x?.service?.utensil)return x.service.utensil;
    if(x?.service?.method)return x.service.method;
    if(x?.type==='bread')return 'Bread tongs';
    if(x?.type==='condiment')return 'Condiment spoon / bottle';
    if(x?.vessel?.type==='chafer')return 'Serving spoon';
    return 'Serving utensil';
  }
  function productionText(x){
    const q=x?.quantity||x?.side?.quantity||x?.bread?.quantity;if(!q)return '';
    if(q.unit==='tin')return `${q.amount} tin${q.amount===1?'':'s'} to produce`;
    if(q.unit==='recipe')return `${q.amount} recipe${q.amount===1?'':'s'} to produce`;
    if(q.unit==='ear')return `${q.amount} ear${q.amount===1?'':'s'} to prepare`;
    if(q.pieces)return `${q.pieces} pieces to prepare`;
    if(q.packages)return `${q.packages} package${q.packages===1?'':'s'}`;
    return q.amount==null?'':`${q.amount} to produce`;
  }
  function quantityText(x){
    const q=x?.quantity||x?.side?.quantity||x?.bread?.quantity;if(!q)return 'Use locked menu quantity';
    if(q.unit==='tin')return `${q.amount} tin${q.amount===1?'':'s'}`;
    if(q.unit==='recipe')return `${q.amount} recipe${q.amount===1?'':'s'}`;
    if(q.unit==='ear')return `${q.amount} ear${q.amount===1?'':'s'}`;
    if(q.pieces)return `${q.pieces} pieces`;
    if(q.packages)return `${q.packages} package${q.packages===1?'':'s'}`;
    return q.amount==null?'Use locked menu quantity':String(q.amount);
  }
  function refillText(x){
    const q=x?.quantity||x?.side?.quantity||x?.bread?.quantity;
    return q?'Present service vessel(s) as planned; keep remaining production as backup and refill before the vessel is empty.':'Refill from the locked menu quantity; do not change the buy/yield plan.';
  }
  function presentationPlan(x){
    const q=x?.quantity||x?.side?.quantity||x?.bread?.quantity,behavior=q?.behavior||x?.behavior||null,factor=Number(behavior?.initialPortion);
    if(q&&Number.isFinite(factor)&&factor>0&&factor<1){
      const pct=Math.round(factor*100),initial=Math.max(0,Number(q.amount)||0)*factor,backup=Math.max(0,(Number(q.amount)||0)-initial);
      return{initial:`Start with ${pct}% of planned production`,backup:backup>0?`Hold ${Math.round(backup*100)/100} ${q.unit||'units'} as backup`:'No production remains in backup',trigger:'Refill when the service vessel reaches about 25% remaining.'};
    }
    if(q&&q.amount!=null){const unit=q.unit||'units',amount=Number(q.amount)||0;return{initial:'Start with 1 service vessel',backup:`Hold remaining ${amount} ${unit} as backup`,trigger:'Refill before the service vessel is empty.'};}
    return{initial:'Set out the planned service vessel',backup:'Hold remaining production as backup',trigger:'Refill before the service vessel is empty.'};
  }
  function stationPlan(layout){
    return(layout?.segments||[]).map(seg=>{let offset=0;const items=(seg.items||[]).flatMap(g=>(g.items||[]).map(x=>{const w=Math.max(0,Number(g?.linearIn)||0),start=offset;offset+=w;const p=presentationPlan(x);return{id:x.id||x.name,name:itemName(x),station:g.station,vessel:x.vessel?.label||x.vessel?.type||'',service:serviceText(x),utensil:utensilText(x),production:productionText(x),quantity:quantityText(x),refill:refillText(x),initial:p.initial,backup:p.backup,refillTrigger:p.trigger,width:w,startIn:start,endIn:offset,position:`${start}\"–${offset}\" from table start`};}));return{table:seg.table,length:seg.length,used:seg.used,remaining:Math.max(0,seg.remaining),stations:seg.stations.map(id=>({id,label:stationLabel(id)})),items};});
  }
  function serviceSequence(layout,rows=stationPlan(layout)){return rows.flatMap(seg=>(seg.items||[]).map(item=>({...item,table:seg.table}))).sort((a,b)=>rank(a.station)-rank(b.station)||a.table-b.table||a.startIn-b.startIn).map((r,i)=>({...r,sequence:i+1,setup:`Set ${r.name} at Table ${r.table}, ${r.position}.`,backupAction:`Keep backup off the buffet; ${r.refillTrigger.toLowerCase()}`}));}
  function guestFlow(layout,rows=serviceSequence(layout)){
    const stations=[...new Map(rows.map(r=>[r.station,{id:r.station,label:stationLabel(r.station)}])).values()].sort((a,b)=>rank(a.id)-rank(b.id));
    const first=rows[0],last=rows[rows.length-1];
    return{entry:first?`Enter at Table ${first.table} (${stationLabel(first.station)}).`:'Enter at the buffet start.',exit:last?`Exit after Table ${last.table} (${stationLabel(last.station)}).`:'Exit at the buffet finish.',direction:`One-way guest movement: Table 1 → Table ${layout?.tableLengths?.length||4}.`,stations,pressurePoints:rows.filter(r=>['core','specialty'].includes(r.station)).map(r=>r.name),crewRule:'Keep guests moving forward; crew replenishes from the kitchen side so the guest lane stays clear.'};
  }
  function allocate(groups,tableLengths=B0.TABLE_GEOMETRY.main,options={}){
    const lengths=tableLengths.map(Number).filter(n=>Number.isFinite(n)&&n>0),segments=lengths.map((length,i)=>({table:i+1,length,items:[],used:0,remaining:length,stations:[],overflow:false}));
    const required=(groups||[]).reduce((s,g)=>s+width(g),0),provided=lengths.reduce((s,n)=>s+n,0);
    const ordered=(groups||[]).map((g,i)=>({g,i,w:width(g),p:preferred(g),r:rank(g.station)})).filter(x=>x.w>0).sort((a,b)=>a.r-b.r||b.w-a.w||a.i-b.i);
    const memo=new Map(),better=(a,b)=>a.overflow!==b.overflow?(a.overflow<b.overflow?-1:1):a.pref!==b.pref?(a.pref<b.pref?-1:1):a.tables-b.tables;
    function solve(i,start,sr,max,used){
      if(i>=ordered.length)return{overflow:0,pref:0,tables:0,choices:[]};
      const key=`${i}|${start}|${sr}|${max}|${used.join(',')}`;if(memo.has(key))return memo.get(key);
      const x=ordered[i],changed=x.r!==sr,choices=[];
      for(let t=start;t<lengths.length;t++){
        if(x.w>lengths[t]-used[t]+1e-9)continue;
        const u=used.slice();u[t]+=x.w;const ns=changed?Math.max(max,t):start,nm=changed?t:Math.max(max,t),next=solve(i+1,ns,x.r,nm,u);
        choices.push({overflow:next.overflow,pref:next.pref+Math.abs(t-x.p),tables:next.tables+(used[t]===0?1:0),choices:[{idx:i,table:t,overflow:false},...next.choices]});
      }
      const next=solve(i+1,start,sr,max,used);choices.push({overflow:next.overflow+x.w,pref:next.pref+Math.abs(x.p),tables:next.tables,choices:[{idx:i,table:-1,overflow:true},...next.choices]});
      let best=choices[0];for(let j=1;j<choices.length;j++)if(better(choices[j],best)<0)best=choices[j];memo.set(key,best);return best;
    }
    const result=ordered.length?solve(0,0,-1,-1,lengths.map(()=>0)):{overflow:0,pref:0,tables:0,choices:[]},choices=new Map(result.choices.map(c=>[c.idx,c]));
    ordered.forEach((x,i)=>{const c=choices.get(i);if(!c||c.overflow)return;const s=segments[c.table];s.items.push(x.g);s.used+=x.w;s.remaining-=x.w;if(!s.stations.includes(x.g.station))s.stations.push(x.g.station)});
    const overflowGroups=ordered.filter((x,i)=>!choices.get(i)||choices.get(i).overflow).map(x=>x.g),overflowIn=Math.max(0,required-provided),displacedIn=overflowGroups.reduce((s,g)=>s+width(g),0),recommended=options.resolveRecommendation===false?lengths:recommend(groups,required,lengths);
    const out={shape:'U',tableLengths:lengths,linearRequired:required,linearProvided:provided,overflow:overflowGroups.length>0||required>provided,overflowIn,displacedIn,overflowGroups,overflowItems:overflowGroups.flatMap(g=>(g.items||[]).map(itemName)),overflowStations:[...new Set(overflowGroups.map(g=>g.station))].sort((a,b)=>rank(a)-rank(b)),segments,recommendedTables:recommended};
    out.stationPlan=stationPlan(out);out.serviceSequence=serviceSequence(out,out.stationPlan);out.guestFlow=guestFlow(out,out.serviceSequence);
    if(options.includeRecommended!==false&&out.overflow&&recommended.length>lengths.length){const key=`${signature(groups)}|${recommended.join(',')}`;out.recommendedLayout=layoutCache.get(key)||allocate(groups,recommended,{includeRecommended:false,resolveRecommendation:false});layoutCache.set(key,out.recommendedLayout)}
    return out;
  }
  function plan(input={}){const p=B0.plan(input),layout=allocate(p.serviceGroups,input.mainTableLengths||B0.TABLE_GEOMETRY.main);return{...p,tables:{...p.tables,tables:layout.tableLengths,linearRequired:layout.linearRequired,linearProvided:layout.linearProvided,layout,overflow:layout.overflow}}}
  const B=Object.freeze({...B0,plan});
  window.BuffetEngine=B;
  window.BuffetAllocation=Object.freeze({allocate,itemName,preferred,stationPlan,serviceSequence,guestFlow});
})();

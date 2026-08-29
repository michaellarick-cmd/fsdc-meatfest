/* Meatfest calculation lock — authoritative final calculation path.
 * This script MUST load last. It deliberately overrides the legacy calc()
 * and buildSummary() in app.js so no earlier formula can reintroduce the
 * per-protein multiplier bug.
 */
(function(){
  const ROLE_WEIGHT={brisket:.25,pork:.20,ribs:.15,brats:.15,chicken:.15,pmbe:.10,prime:.15,turkey:.15,fish:.10,porkbelly:.10};
  const weight=k=>ROLE_WEIGHT[k]??1;
  const allocations=keys=>{const total=keys.reduce((s,k)=>s+weight(k),0);const a={};keys.forEach(k=>a[k]=total?weight(k)/total:0);return a;};
  const serving=()=>Number($("serving").value)||1/3;
  function calculate(){
    const [adults,kids]=activeTotals(),eaters=adults+kids*.5,keys=[...selected],alloc=allocations(keys),totalFinished=eaters*serving(),rows=[];
    keys.forEach(k=>{
      const m=meats[k],o=m.options[choices[k]],finished=totalFinished*alloc[k],target=planningMode==="family"?finished*1.125:finished;
      const hog=o.yield==="hog"?wholeHogPlan(target):null,y=hog?hog.yield:o.yield,bought=hog?hog.hangingWeight:(y?target/y:target);
      let units=null,buyWeight=bought,buyOverride=null,note="",excess=0;
      if(k==="porkbelly"){units=1;buyWeight=bought;buyOverride="BUY 1 whole skinless pork belly (~8–10 lb)";note="Rich secondary protein. Use the calculated amount for this cook and portion/freeze the remaining belly for a future cook.";}
      else if(planningMode==="family"&&k!=="hog"){const fp=familyPurchase(k,o,bought);if(fp){units=fp.units;buyWeight=fp.buyWeight;buyOverride=fp.buy;note=fp.note;excess=Math.max(0,buyWeight-bought);}}
      else if(o.mode==="units"){const unitWeight=k==="brats"?.25:o.unitWeight;units=Math.max(1,Math.ceil(bought/unitWeight));buyWeight=units*unitWeight;excess=Math.max(0,buyWeight-bought);note=cutNote(k,o);if(!note&&excess>.5)note="Purchase amount is rounded to practical units; excess is planned leftovers.";}
      else if(o.mode==="hog"){units=1;buyWeight=bought;note="Buy one whole hog; target the calculated hanging-weight requirement.";}
      else note="Fish is always calculated as purchased fillets.";
      rows.push({k,m,o,finished,target,y,bought,units,buyWeight,excess,note,buyOverride});
    });
    return {adults,kids,eaters,totalFinished,rows,total:rows.reduce((s,r)=>s+r.buyWeight,0)};
  }
  function buyText(r){
    if(r.buyOverride)return r.buyOverride;
    if(r.k==="hog")return `BUY 1 whole hog (~${Math.ceil(r.buyWeight)} lb hanging weight)`;
    if(r.k==="brisket"&&choices[r.k]==="packer")return `BUY ${r.units} packer${r.units>1?"s":""} (~${r.units*14}–${r.units*18} lb total)`;
    if(r.k==="brats")return `BUY ${r.units} link${r.units===1?"":"s"} (~${Math.ceil(r.buyWeight*10)/10} lb total)`;
    const special=purchaseDisplay(r.k,r.o,r.units,r.buyWeight);return special||`BUY ${r.units} ${r.o.unit}${r.units>1?"s":""} (~${Math.ceil(r.buyWeight*10)/10} lb total)`;
  }
  function render(s){
    $("statAdults").textContent=s.adults;$("statKids").textContent=s.kids;$("statEaters").textContent=Math.round(s.eaters*10)/10;$("totalRaw").textContent=s.total?`${Math.ceil(s.total*10)/10} lb`:"0 lb";
    $("summary").textContent=s.rows.length?`${s.rows.length} protein${s.rows.length>1?"s":""} • ${Math.round(s.eaters*10)/10} adult-equivalent eaters${planningMode==="family"?" • 10–15% family cushion":""}`:"Select at least one protein.";
    $("results").innerHTML=s.rows.length?s.rows.map(r=>{const buy=buyText(r),ex=r.excess>.5?` • Planned excess: <span class="excess">${Math.round(r.excess*10)/10} lb</span>`:"",cushion=planningMode==="family"?` • Family cushion target: <b>${Math.round((r.target-r.finished)*10)/10} lb finished</b>`:"",unit=(r.k!=="porkbelly"&&r.o.mode==="units"&&r.k!=="hog"&&planningMode!=="family")?` • Planning unit: ${r.k==="brats"?.25:r.o.unitWeight} lb`:"";return `<div class="result"><div class="resultTop"><div><div class="resultTitle">${r.m.name}</div><span class="pill">${r.o.label}</span><span class="pill">${Math.round(r.y*100)}% yield</span></div><div class="buy">${buy}</div></div><div class="details">Finished meat needed: <b>${Math.round(r.finished*10)/10} lb</b>${cushion} • Raw requirement: <b>${Math.round(r.bought*10)/10} lb</b>${unit}${ex}</div>${r.note?`<div class="purchaseNote">${r.note}</div>`:""}${r.k==="hog"?wholeHogWarning(r.buyWeight):""}</div>`;}).join(""):"<p class='note'>Select at least one protein.</p>";
    calcSides();
  }
  window.calc=function(){render(calculate());};
  window.buildSummary=function(){const s=calculate();return {adults:s.adults,kids:s.kids,eaters:s.eaters,rows:s.rows.map(r=>({...r,buy:buyText(r)})),total:s.total};};
  if(meats.brats&&meats.brats.options&&meats.brats.options.links)meats.brats.options.links.unitWeight=.25;
  setTimeout(function(){if(typeof renderMeats==="function")renderMeats();calc();},0);
})();

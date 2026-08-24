/*
 * Meatfest calculation correction v1.0
 *
 * The portion choice is the TOTAL finished-meat target per adult-equivalent,
 * not a separate portion for every selected protein.
 *
 * Protein weights are normalized across the proteins actually selected. They
 * describe each protein's role in a multi-protein Meatfest rather than giving
 * every protein an equal share.
 */
(function(){
  const ROLE_WEIGHT={
    brisket:.25,
    pork:.20,
    ribs:.15,
    brats:.15,
    chicken:.15,
    pmbe:.10,
    prime:.15,
    turkey:.15,
    fish:.10,
    porkbelly:.10
  };

  function proteinRoleWeight(k){ return ROLE_WEIGHT[k] ?? 1; }

  function allocationMap(keys){
    const total=keys.reduce((s,k)=>s+proteinRoleWeight(k),0);
    const out={};
    keys.forEach(k=>out[k]=proteinRoleWeight(k)/total);
    return out;
  }

  function meatPerEater(){
    return Number($("serving").value)||1/3;
  }

  function calculateRows(){
    const [adults,kids]=activeTotals();
    const eaters=adults+kids*.5;
    const keys=[...selected];
    const allocations=allocationMap(keys);
    const totalFinishedTarget=eaters*meatPerEater();
    const rows=[];

    keys.forEach(k=>{
      const m=meats[k],o=m.options[choices[k]];
      const finished=eaters?totalFinishedTarget*allocations[k]:0;
      const targetFinished=planningMode==="family"?finished*1.125:finished;
      const hogPlan=o.yield==="hog"?wholeHogPlan(targetFinished):null;
      const y=hogPlan?hogPlan.yield:o.yield;
      const bought=hogPlan?hogPlan.hangingWeight:(y?targetFinished/y:targetFinished);

      let units=null,buyWeight=bought,purchaseNote="",excess=0,buyOverride=null;

      if(k==="porkbelly"){
        units=1;
        buyWeight=bought;
        buyOverride="BUY 1 whole skinless pork belly (~8–10 lb)";
        purchaseNote="Rich secondary protein. Use the calculated amount for this cook and portion/freeze the remaining belly for a future cook.";
      }else if(planningMode==="family"&&k!=="hog"){
        const fp=familyPurchase(k,o,bought);
        if(fp){
          units=fp.units;buyWeight=fp.buyWeight;buyOverride=fp.buy;purchaseNote=fp.note;
          excess=Math.max(0,buyWeight-bought);
        }
      }else if(o.mode==="units"){
        const unitWeight=k==="brats"?.25:o.unitWeight;
        units=Math.max(1,Math.ceil(bought/unitWeight));
        buyWeight=units*unitWeight;
        excess=Math.max(0,buyWeight-bought);
        purchaseNote=cutNote(k,o);
        if(!purchaseNote&&excess>.5)purchaseNote="Purchase amount is rounded to practical units; excess is planned leftovers.";
      }else if(o.mode==="hog"){
        units=1;
        buyWeight=bought;
        purchaseNote="Buy one whole hog; target the calculated hanging-weight requirement.";
      }else{
        purchaseNote="Fish is always calculated as purchased fillets.";
      }

      rows.push({k,m,o,finished,targetFinished,y,bought,units,buyWeight,excess,purchaseNote,buyOverride});
    });
    return {adults,kids,eaters,totalFinishedTarget,rows,total:rows.reduce((s,r)=>s+r.buyWeight,0)};
  }

  function rowBuy(r){
    if(r.buyOverride)return r.buyOverride;
    if(r.k==="hog")return `BUY 1 whole hog (~${Math.ceil(r.buyWeight)} lb hanging weight)`;
    if(r.k==="brisket"&&choices[r.k]==="packer")return `BUY ${r.units} ${r.o.unit}${r.units>1?"s":""} (~${r.units*14}–${r.units*18} lb total)`;
    if(r.k==="brats")return `BUY ${r.units} link${r.units===1?"":"s"} (~${Math.ceil(r.buyWeight*10)/10} lb total)`;
    const special=purchaseDisplay(r.k,r.o,r.units,r.buyWeight);
    if(special)return special;
    return `BUY ${r.units} ${r.o.unit}${r.units>1?"s":""} (~${Math.ceil(r.buyWeight*10)/10} lb total)`;
  }

  window.calc=function(){
    const s=calculateRows();
    $("statAdults").textContent=s.adults;
    $("statKids").textContent=s.kids;
    $("statEaters").textContent=Math.round(s.eaters*10)/10;
    $("totalRaw").textContent=s.total?`${Math.ceil(s.total*10)/10} lb`:"0 lb";
    $("summary").textContent=s.rows.length?`${s.rows.length} protein${s.rows.length>1?"s":""} • ${Math.round(s.eaters*10)/10} adult-equivalent eaters${planningMode==="family"?" • 10–15% family cushion":""}`:"Select at least one protein.";

    $("results").innerHTML=s.rows.length?s.rows.map(r=>{
      const buy=rowBuy(r);
      const ex=r.excess>.5?` • Planned excess: <span class="excess">${Math.round(r.excess*10)/10} lb</span>`:"";
      const cushion=planningMode==="family"?` • Family cushion target: <b>${Math.round((r.targetFinished-r.finished)*10)/10} lb finished</b>`:"";
      const unit=(r.k!=="porkbelly"&&r.o.mode==="units"&&r.k!=="hog"&&planningMode!=="family")?` • Planning unit: ${r.k==="brats"?.25:r.o.unitWeight} lb`:"";
      return `<div class="result"><div class="resultTop"><div><div class="resultTitle">${r.m.name}</div><span class="pill">${r.o.label}</span><span class="pill">${Math.round(r.y*100)}% yield</span></div><div class="buy">${buy}</div></div><div class="details">Finished meat needed: <b>${Math.round(r.finished*10)/10} lb</b>${cushion} • Raw requirement: <b>${Math.round(r.bought*10)/10} lb</b>${unit}${ex}</div>${r.purchaseNote?`<div class="purchaseNote">${r.purchaseNote}</div>`:""}${r.k==="hog"?wholeHogWarning(r.buyWeight):""}</div>`;
    }).join(""):"<p class='note'>Select at least one protein.</p>";
    calcSides();
  };

  window.buildSummary=function(){
    const s=calculateRows();
    return {adults:s.adults,kids:s.kids,eaters:s.eaters,rows:s.rows.map(r=>({...r,buy:rowBuy(r)})),total:s.total};
  };

  // Keep the user's stated Meatfest sausage planning unit: each link is ~¼ lb.
  if(meats.brats&&meats.brats.options&&meats.brats.options.links){
    meats.brats.options.links.unitWeight=.25;
  }

  // The original app calls these during initialization; run once after this
  // final override is installed so the visible result immediately matches it.
  setTimeout(function(){ if(typeof renderMeats==="function")renderMeats(); calc(); },0);
})();

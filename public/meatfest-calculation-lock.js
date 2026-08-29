/*
 * Meatfest calculation lock — authoritative final calculation path.
 *
 * This is deliberately loaded LAST by worker.js. It overrides the legacy
 * calc()/buildSummary() so the displayed shopping list has exactly one
 * calculation path.
 *
 * IMPORTANT: the serving choice is the TOTAL finished-meat target per
 * adult-equivalent for the event. The validated Meatfest distribution
 * allocates that total across the selected proteins; it does not multiply
 * the serving target by the number of proteins.
 */
(function(){
  const BASE=Object.freeze({
    chicken:(.5+1/3)/2,
    fish:.25,
    pork:1/3,
    hog:1/3,
    brats:.25,
    brisket:.5,
    pmbe:.5,
    prime:.5,
    ribs:.5,
    porkbelly:(1/3)*.75
  });
  const MULT=Object.freeze({
    '.5':[1,.6,.376455,.2857,.25,.22221,.19442,.1782092],
    '.333333':[1,.4,.25097,.1904667,.1666667,.14814,.1296133,.1188061],
    '.25':[.75,.3333,.2,.1667,.125,.111105,.0909,.0817429]
  });
  function servingKey(v){v=Number(v);if(Math.abs(v-.5)<1e-6)return '.5';if(Math.abs(v-.25)<1e-6)return '.25';return '.333333';}
  function validatedMultiplier(n,serving){const t=MULT[servingKey(serving)];return t[Math.max(1,Math.min(8,n))-1];}

  function calculateRows(){
    const [adults,kids]=activeTotals();
    const eaters=adults+kids*.5;
    const keys=[...selected];
    if(!eaters||!keys.length)return {adults,kids,eaters,rows:[],total:0};
    const mult=validatedMultiplier(keys.length,+$("serving").value);
    const rows=[];

    keys.forEach(k=>{
      const m=meats[k],o=m.options[choices[k]];
      const per=BASE[k]==null?0:BASE[k]*mult;
      const finished=eaters*per;
      const targetFinished=planningMode==="family"?finished*1.125:finished;
      const hogPlan=o.yield==="hog"?wholeHogPlan(targetFinished):null;
      const y=hogPlan?hogPlan.yield:o.yield;
      const bought=hogPlan?hogPlan.hangingWeight:(y?targetFinished/y:targetFinished);
      let units=null,buyWeight=bought,purchaseNote="",excess=0,buyOverride=null;

      if(k==="porkbelly"){
        units=1;buyWeight=bought;
        buyOverride="BUY 1 whole skinless pork belly (~8–10 lb)";
        purchaseNote="Rich secondary protein. Use the calculated amount for this cook and portion/freeze the remaining belly for a future cook.";
      }else if(planningMode==="family"&&k!=="hog"){
        const fp=familyPurchase(k,o,bought);
        if(fp){units=fp.units;buyWeight=fp.buyWeight;buyOverride=fp.buy;purchaseNote=fp.note;excess=Math.max(0,buyWeight-bought);}
      }else if(o.mode==="units"){
        const unitWeight=k==="brats"?.25:o.unitWeight;
        units=Math.max(1,Math.ceil(bought/unitWeight));
        buyWeight=units*unitWeight;
        excess=Math.max(0,buyWeight-bought);
        purchaseNote=cutNote(k,o);
        if(!purchaseNote&&excess>.5)purchaseNote="Purchase amount is rounded to practical units; excess is planned leftovers.";
      }else if(o.mode==="hog"){
        units=1;buyWeight=bought;purchaseNote="Buy one whole hog; target the calculated hanging-weight requirement.";
      }else{
        purchaseNote="Fish is always calculated as purchased fillets.";
      }
      rows.push({k,m,o,finished,targetFinished,y,bought,units,buyWeight,excess,purchaseNote,buyOverride});
    });
    return {adults,kids,eaters,rows,total:rows.reduce((s,r)=>s+r.buyWeight,0)};
  }

  function buyText(r){
    if(r.buyOverride)return r.buyOverride;
    if(r.k==="hog")return `BUY 1 whole hog (~${Math.ceil(r.buyWeight)} lb hanging weight)`;
    if(r.k==="brisket"&&choices[r.k]==="packer")return `BUY ${r.units} ${r.o.unit}${r.units>1?'s':''} (~${r.units*14}–${r.units*18} lb total)`;
    if(r.k==="brats")return `BUY ${r.units} link${r.units===1?'':'s'} (~${Math.ceil(r.buyWeight*10)/10} lb total)`;
    const special=purchaseDisplay(r.k,r.o,r.units,r.buyWeight);
    return special||`BUY ${r.units} ${r.o.unit}${r.units>1?'s':''} (~${Math.ceil(r.buyWeight*10)/10} lb total)`;
  }

  function render(s){
    $("statAdults").textContent=s.adults;
    $("statKids").textContent=s.kids;
    $("statEaters").textContent=Math.round(s.eaters*10)/10;
    $("totalRaw").textContent=s.total?`${Math.ceil(s.total*10)/10} lb`:"0 lb";
    $("summary").textContent=s.rows.length?`${s.rows.length} protein${s.rows.length>1?'s':''} • ${Math.round(s.eaters*10)/10} adult-equivalent eaters${planningMode==='family'?' • 10–15% family cushion':''}`:"Select at least one protein.";
    $("results").innerHTML=s.rows.length?s.rows.map(r=>{
      const buy=buyText(r);
      const ex=r.excess>.5?` • Planned excess: <span class="excess">${Math.round(r.excess*10)/10} lb</span>`:"";
      const cushion=planningMode==='family'?` • Family cushion target: <b>${Math.round((r.targetFinished-r.finished)*10)/10} lb finished</b>`:"";
      const unit=(r.k!=="porkbelly"&&r.o.mode==="units"&&r.k!=="hog"&&planningMode!=="family")?` • Planning unit: ${r.k==='brats'?.25:r.o.unitWeight} lb`:"";
      return `<div class="result"><div class="resultTop"><div><div class="resultTitle">${r.m.name}</div><span class="pill">${r.o.label}</span><span class="pill">${Math.round(r.y*100)}% yield</span></div><div class="buy">${buy}</div></div><div class="details">Finished meat needed: <b>${Math.round(r.finished*10)/10} lb</b>${cushion} • Raw requirement: <b>${Math.round(r.bought*10)/10} lb</b>${unit}${ex}</div>${r.purchaseNote?`<div class="purchaseNote">${r.purchaseNote}</div>`:""}${r.k==='hog'?wholeHogWarning(r.buyWeight):""}</div>`;
    }).join(""):"<p class='note'>Select at least one protein.</p>";
    calcSides();
  }

  window.calc=function(){render(calculateRows());};
  window.buildSummary=function(){const s=calculateRows();return {adults:s.adults,kids:s.kids,eaters:s.eaters,rows:s.rows.map(r=>({...r,buy:buyText(r)})),total:s.total};};

  if(meats.brats&&meats.brats.options&&meats.brats.options.links)meats.brats.options.links.unitWeight=.25;

  setTimeout(function(){if(typeof renderMeats==='function')renderMeats();calc();},0);
})();

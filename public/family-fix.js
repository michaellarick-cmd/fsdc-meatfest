// Family mode correction v1.1 — selected portion is the complete finished-meat target.
(function(){
  function correctedMultiplier(n,serv){
    const t={".5":[1,.6,.376455,.2857,.25,.22221,.19442,.1782092],".333333":[1,.4,.25,.1904667,.1666667,.14814,.1296133,.1188061],".25":[.75,.3333,.2,.1667,.125,.111105,.0909,.0817429]};
    const v=Number(serv),key=Math.abs(v-.5)<1e-6?".5":Math.abs(v-.25)<1e-6?".25":".333333";
    return t[key][Math.max(1,Math.min(8,n))-1];
  }
  window.multiplier=correctedMultiplier;
  window.calc=function(){
    let [adults,kids]=activeTotals(),eaters=adults+kids*.5,n=selected.size,mult=correctedMultiplier(n,+$("serving").value),rows=[],raw=0;
    selected.forEach(k=>{
      const m=meats[k],o=m.options[choices[k]];
      let per=k==="chicken"?((.5+1/3)/2)*mult:k==="fish"?.25*mult:(k==="pork"||k==="hog")?(1/3)*mult:k==="brats"?.25*mult:.5*mult;
      const finished=eaters*per,targetFinished=finished,hogPlan=o.yield==="hog"?wholeHogPlan(targetFinished):null,y=hogPlan?hogPlan.yield:o.yield,bought=hogPlan?hogPlan.hangingWeight:targetFinished/y;
      let units=null,buyWeight=bought,purchaseNote="",excess=0,buyOverride=null;
      if(planningMode==="family"&&k!=="hog"){const fp=familyPurchase(k,o,bought);if(fp){units=fp.units;buyWeight=fp.buyWeight;buyOverride=fp.buy;purchaseNote=fp.note;excess=Math.max(0,buyWeight-bought)}}
      else if(o.mode==="units"){units=Math.max(1,Math.ceil(bought/o.unitWeight));buyWeight=units*o.unitWeight;if(k==="brisket"&&choices[k]==="packer"){units=Math.max(1,Math.ceil(bought/14));buyWeight=units*14;excess=Math.max(0,buyWeight-bought);purchaseNote=cutNote(k,o)}else{excess=Math.max(0,buyWeight-bought);purchaseNote=cutNote(k,o)}}
      else if(o.mode==="hog"){units=1;buyWeight=bought;purchaseNote="Buy one whole hog; target the calculated hanging-weight requirement."}
      else purchaseNote="Fish is always calculated as purchased fillets.";
      raw+=buyWeight;rows.push({k,m,o,finished,targetFinished,y,bought,units,buyWeight,excess,purchaseNote,buyOverride});
    });
    $("statAdults").textContent=adults;$("statKids").textContent=kids;$("statEaters").textContent=Math.round(eaters*10)/10;$("totalRaw").textContent=raw?`${Math.ceil(raw*10)/10} lb`:"0 lb";$("summary").textContent=n?`${n} protein${n>1?"s":""} • ${Math.round(eaters*10)/10} adult-equivalent eaters`:"Select at least one protein.";
    $("results").innerHTML=rows.length?rows.map(r=>{const specialBuy=purchaseDisplay(r.k,r.o,r.units,r.buyWeight),buy=r.buyOverride||(r.o.mode==="weight"?`BUY ${Math.ceil(r.bought*10)/10} lb of fillets`:r.k==="hog"?`BUY 1 whole hog (~${Math.ceil(r.buyWeight)} lb hanging weight)`:r.k==="brisket"&&choices[r.k]==="packer"?`BUY ${r.units} ${r.o.unit}${r.units>1?"s":""} (~${r.units*14}–${r.units*18} lb total)`:specialBuy||`BUY ${r.units} ${r.o.unit}${r.units>1?"s":""} (~${Math.ceil(r.buyWeight*10)/10} lb total)`),ex=r.excess>.5?` • Planned excess: <span class="excess">${Math.round(r.excess*10)/10} lb</span>`:"";return `<div class="result"><div class="resultTop"><div><div class="resultTitle">${r.m.name}</div><span class="pill">${r.o.label}</span><span class="pill">${Math.round(r.y*100)}% yield</span></div><div class="buy">${buy}</div></div><div class="details">Finished meat needed: <b>${Math.round(r.finished*10)/10} lb</b> • Raw requirement: <b>${Math.round(r.bought*10)/10} lb</b>${r.o.mode==="units"&&r.k!=="hog"&&planningMode!=="family"?` • Planning unit: ${r.o.unitWeight} lb`:""}${ex}</div>${r.purchaseNote?`<div class="purchaseNote">${r.purchaseNote}</div>`:""}${r.k==="hog"?wholeHogWarning(r.buyWeight):""}</div>`}).join(""):"<p class='note'>Select at least one protein.</p>";calcSides();
  };
})();

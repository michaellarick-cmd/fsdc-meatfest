/* FSDC Meatfest additions — future protein/side additions. */
(function(){
  const TURKEY_KEY="turkey";
  const TURKEY_OPTIONS={
    whole:{label:"Whole Turkey",yield:.40,unitWeight:14,unit:"whole turkey",mode:"units",note:"Whole-bird purchase; 40% planning yield accounts for bone, skin and cooking loss."},
    breast:{label:"Turkey Breast",yield:.64,unitWeight:7,unit:"turkey breast",mode:"units",note:"Bone-in turkey breast; practical for smoked turkey and smaller gatherings."},
    legs:{label:"Turkey Legs",yield:.45,unitWeight:.75,unit:"turkey leg",mode:"units",note:"Individual BBQ turkey legs; purchase by the leg rather than bulk weight."}
  };
  meats[TURKEY_KEY]={name:"Turkey",default:"whole",options:TURKEY_OPTIONS};
  if(!order.includes(TURKEY_KEY)) order.push(TURKEY_KEY);
  choices[TURKEY_KEY]=choices[TURKEY_KEY]||meats[TURKEY_KEY].default;

  const PORK_BELLY_KEY="porkbelly";
  meats[PORK_BELLY_KEY]={name:"Pork Belly Burnt Ends",default:"belly",options:{belly:{label:"Skinless Pork Belly",yield:.62,unitWeight:10,unit:"whole pork belly",mode:"units",note:"Rich secondary protein. Whole skinless bellies commonly run about 8–10 lb; portion and freeze excess for a future cook."}}};
  if(!order.includes(PORK_BELLY_KEY)) order.push(PORK_BELLY_KEY);
  choices[PORK_BELLY_KEY]=choices[PORK_BELLY_KEY]||meats[PORK_BELLY_KEY].default;

  sides.greenbeans={name:"Green Beans",group:"main",unit:"recipe",base:1.0,min:.5,sensitivity:.70,round:.25,fill:"recipe",note:"Grilled or smoked BBQ vegetable side."};
  sides.asparagus={name:"Asparagus",group:"main",unit:"recipe",base:1.0,min:.5,sensitivity:.70,round:.25,fill:"recipe",note:"Grilled or smoked BBQ vegetable side."};
  sides.potatosalad={name:"Potato Salad",group:"main",unit:"recipe",base:1.5,min:.5,sensitivity:.55,round:.5,fill:"recipe",note:"Classic BBQ side."};
  sides.pastasalad={name:"Pasta Salad",group:"main",unit:"recipe",base:1.5,min:.5,sensitivity:.55,round:.5,fill:"recipe",note:"Classic BBQ side."};
  ["greenbeans","asparagus","potatosalad","pastasalad"].forEach(id=>{if(!sideOrder.includes(id))sideOrder.push(id)});

  const baseFamilyPurchase=familyPurchase;
  familyPurchase=function(k,o,bought){
    if(k===PORK_BELLY_KEY){const w=Number(bought),units=Math.max(1,Math.ceil((w-1e-9)/10));return {units,buyWeight:units*10,buy:`BUY ${units} whole skinless pork belly${units===1?"":"s"} (~${units*10} lb total)`,note:"Whole bellies commonly run about 8–10 lb. Portion and freeze excess for a future cook."};}
    if(k!==TURKEY_KEY)return baseFamilyPurchase(k,o,bought);
    const lb=x=>Math.ceil((x-1e-9)*10)/10,form=choices[TURKEY_KEY]||"whole";
    if(form==="whole"){const w=Math.max(8,Math.ceil((bought-1e-9)/2)*2);return {units:1,buyWeight:w,buy:`ASK FOR ~${lb(w)} lb whole turkey`,note:"Family-size whole bird; excess is expected and useful."};}
    if(form==="breast"){const w=Math.max(3,Math.ceil((bought-1e-9)*2)/2);return {units:1,buyWeight:w,buy:`ASK FOR ~${lb(w)} lb turkey breast`,note:"Turkey breast is a practical alternative when a whole bird is not wanted."};}
    const legs=Math.max(1,Math.ceil((bought-1e-9)/.75)),w=legs*.75;return {units:legs,buyWeight:w,buy:`BUY ${legs} turkey leg${legs===1?"":"s"} (~${lb(w)} lb total)`,note:"BBQ turkey legs are planned and purchased individually."};
  };

  // Preserve the existing universal portion choices and the established
  // multi-protein reduction. Pork belly retains its separate richness factor.
  function installPorkBellyCalc(){
    const currentCalc=window.calc;if(typeof currentCalc!=="function")return;
    window.calc=function(){
      let [adults,kids]=activeTotals(),eaters=adults+kids*.5,n=selected.size,mult=multiplierForPork(n,+$("serving").value),rows=[],raw=0;
      selected.forEach(k=>{
        const m=meats[k],o=m.options[choices[k]],per=k==="porkbelly"?(1/3)*.75*mult:(k==="chicken"?((.5+1/3)/2)*mult:k==="fish"?.25*mult:(k==="pork"||k==="hog")?(1/3)*mult:k==="brats"?.25*mult:.5*mult),finished=eaters*per,targetFinished=planningMode==="family"?finished*1.125:finished,hogPlan=o.yield==="hog"?wholeHogPlan(targetFinished):null,y=hogPlan?hogPlan.yield:o.yield,bought=hogPlan?hogPlan.hangingWeight:targetFinished/y;
        let units=null,buyWeight=bought,purchaseNote="",excess=0,buyOverride=null;
        if(planningMode==="family"&&k!=="hog"){const fp=familyPurchase(k,o,bought);if(fp){units=fp.units;buyWeight=fp.buyWeight;buyOverride=fp.buy;purchaseNote=fp.note;excess=Math.max(0,buyWeight-bought)}}
        else if(o.mode==="units"){units=Math.max(1,Math.ceil(bought/o.unitWeight));buyWeight=units*o.unitWeight;excess=Math.max(0,buyWeight-bought);purchaseNote=k==="porkbelly"?"Whole skinless bellies commonly run about 8–10 lb. Portion and freeze excess for a future cook.":cutNote(k,o)}
        else if(o.mode==="hog"){units=1;buyWeight=bought;purchaseNote="Buy one whole hog; target the calculated hanging-weight requirement."}
        else purchaseNote="Fish is calculated as purchased fillets.";
        raw+=buyWeight;rows.push({k,m,o,finished,targetFinished,y,bought,units,buyWeight,excess,purchaseNote,buyOverride});
      });
      $("statAdults").textContent=adults;$("statKids").textContent=kids;$("statEaters").textContent=Math.round(eaters*10)/10;$("totalRaw").textContent=raw?`${Math.ceil(raw*10)/10} lb`:"0 lb";
      $("summary").textContent=n?`${n} protein${n>1?"s":""} • ${Math.round(eaters*10)/10} adult-equivalent eaters${planningMode==="family"?" • 10–15% family cushion":""}`:"Select at least one protein.";
      $("results").innerHTML=rows.length?rows.map(r=>{const specialBuy=purchaseDisplay(r.k,r.o,r.units,r.buyWeight),buy=r.buyOverride||(r.o.mode==="weight"?`BUY ${Math.ceil(r.bought*10)/10} lb of fillets`:r.k==="hog"?`BUY 1 whole hog (~${Math.ceil(r.buyWeight)} lb hanging weight)`:r.k==="brisket"&&choices[r.k]==="packer"?`BUY ${r.units} ${r.o.unit}${r.units>1?"s":""} (~${r.units*14}–${r.units*18} lb total)`:specialBuy||`BUY ${r.units} ${r.o.unit}${r.units>1?"s":""} (~${Math.ceil(r.buyWeight*10)/10} lb total)`),ex=r.excess>.5?` • Planned excess: <span class="excess">${Math.round(r.excess*10)/10} lb</span>`:"";return `<div class="result"><div class="resultTop"><div><div class="resultTitle">${r.m.name}</div><span class="pill">${r.o.label}</span><span class="pill">${Math.round(r.y*100)}% yield</span></div><div class="buy">${buy}</div></div><div class="details">Finished meat needed: <b>${Math.round(r.finished*10)/10} lb</b> • Raw requirement: <b>${Math.round(r.bought*10)/10} lb</b>${r.o.mode==="units"&&r.k!=="hog"&&planningMode!=="family"?` • Planning unit: ${r.o.unitWeight} lb`:""}${ex}</div>${r.purchaseNote?`<div class="purchaseNote">${r.purchaseNote}</div>`:""}${r.k==="hog"?wholeHogWarning(r.buyWeight):""}</div>`}).join(""):"<p class='note'>Select at least one protein.</p>";
      calcSides();
    };
  }
  function multiplierForPork(n,serving){const standard=multiplier(n,1/3),current=multiplier(n,serving);if(!standard)return 0;return (current/standard)*(Number(serving)/(1/3));}
  renderMeats();renderSideCards();calc();setTimeout(installPorkBellyCalc,0);
})();

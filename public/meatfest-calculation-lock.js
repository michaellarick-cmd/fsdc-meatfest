/* Meatfest calculation lock — authoritative recommendation engine.
 * UI unchanged. Meatfest planning uses the overall portion size and the
 * multi-protein sampling reduction. Count-based proteins (ribs and sausage)
 * use their established taker rules separately; that count logic is NOT
 * multiplied into the finished-meat weight calculation.
 */
(function(){
  const UNIT=Object.freeze({chicken:5,fish:.33,pork:8.5,brats:.50,brisket:14,pmbe:4,prime:5,ribs:2.25,porkbelly:10,turkey:14});
  const TAKE_RATE=.60;
  const RIBS_PER_TAKER=1.75;
  const SAUSAGE_SLICES_PER_TAKER=3.5;
  const RIBS_PER_RACK=11;
  const SAUSAGE_SLICES_PER_LINK=12;

  // Meatfest buffet rule: reduce the overall portion by 15% for each
  // additional protein, but never below 60%. This is applied ONCE to the
  // overall portion size, not again to every protein's finished weight.
  function multiplier(n){return n<1?0:Math.max(.60,1-.15*(n-1))}
  function activeEaters(){const [adults,kids]=activeTotals();return {adults,kids,eaters:adults+kids*.5}}
  function effectiveUnit(k,o){if(k==="chicken"&&choices[k]==="whole")return 5;if(k==="brats")return .5;if(k==="ribs")return 2.25;if(k==="porkbelly")return 10;if(k==="brisket"&&choices[k]==="packer")return 14;if(k==="pmbe")return 4;return Number.isFinite(Number(o.unitWeight))?Number(o.unitWeight):(UNIT[k]||1)}
  function purchaseText(k,units,weight,o){
    if(k==="brisket"&&choices[k]==="packer"){
      if(units===1&&weight>18)return `BUY 1 whole packer (~${Math.round(weight)} lb target)`;
      return `BUY ${units} whole packer${units===1?"":"s"} (~${units*14}–${units*18} lb total)`;
    }
    if(k==="brats")return `BUY ${units} link${units===1?"":"s"} (~${Math.round(weight*10)/10} lb total)`;
    if(k==="chicken"&&choices[k]==="whole")return `BUY ${units} whole chicken${units===1?"":"s"} (~${Math.round(weight*10)/10} lb total)`;
    if(k==="pmbe")return `BUY ${units} chuck roast${units===1?"":"s"} (~${Math.round(weight*10)/10} lb total)`;
    if(k==="ribs")return `BUY ${units} rack${units===1?"":"s"} (~${Math.round(weight*10)/10} lb total)`;
    return `BUY ${units} ${o.unit}${units===1?"":"s"} (~${Math.round(weight*10)/10} lb total)`
  }

  function calculateRows(){
    const {adults,kids,eaters}=activeEaters(),keys=[...selected];
    if(!eaters||!keys.length)return {adults,kids,eaters,rows:[],total:0};
    const serving=Number($("serving").value),mult=multiplier(keys.length);
    const finishedPerProtein=eaters*serving*mult;
    const rows=[];

    keys.forEach(k=>{
      const m=meats[k],o=m.options[choices[k]],finished=finishedPerProtein;
      const targetFinished=planningMode==="family"?finished*1.125:finished;
      let y=o.yield,bought=targetFinished/y,units=1,buyWeight=bought,excess=0,purchaseNote="",buyOverride=null;
      let servingTarget=null,servingUnit=null,unitBased=false;

      if(k==="ribs"){
        const takers=eaters*TAKE_RATE;
        servingTarget=takers*RIBS_PER_TAKER;
        servingUnit="individual ribs";
        units=Math.max(1,Math.ceil(servingTarget/RIBS_PER_RACK));
        buyWeight=units*effectiveUnit(k,o);
        excess=Math.max(0,buyWeight-bought);
        unitBased=true;
        purchaseNote=`Serving target: about ${Math.round(servingTarget)} individual ribs; ${RIBS_PER_RACK} ribs per rack. Purchase is driven by the serving count, not the weight-yield conversion.`;
      }else if(k==="brats"){
        const takers=eaters*TAKE_RATE;
        servingTarget=takers*SAUSAGE_SLICES_PER_TAKER;
        servingUnit="half-inch slices";
        units=Math.max(1,Math.ceil(servingTarget/SAUSAGE_SLICES_PER_LINK));
        buyWeight=units*effectiveUnit(k,o);
        excess=Math.max(0,buyWeight-bought);
        unitBased=true;
        purchaseNote=`Serving target: about ${Math.round(servingTarget)} half-inch slices; ${SAUSAGE_SLICES_PER_LINK} slices per traditional link. Purchase is driven by the serving count, not the weight-yield conversion.`;
      }else if(planningMode==="family"&&k!=="hog"&&typeof familyPurchase==="function"){
        const fp=familyPurchase(k,o,bought);
        if(fp){units=fp.units;buyWeight=fp.buyWeight;buyOverride=fp.buy;purchaseNote=fp.note;excess=Math.max(0,buyWeight-bought)}
      }else if(o.mode==="units"){
        if(k==="brisket"&&choices[k]==="packer"){
          // A single oversized packer is preferable to buying a second brisket
          // when the calculated target is in the ~19–22 lb range.
          if(bought<=18){units=1;buyWeight=14}
          else if(bought<=22){units=1;buyWeight=Math.ceil(bought);purchaseNote=`Target is ${Math.round(bought*10)/10} lb raw; buy one oversized whole packer around ${Math.ceil(bought)} lb if available.`}
          else {units=Math.ceil(bought/18);buyWeight=Math.max(bought,units*14);purchaseNote=`Raw target is ${Math.round(bought*10)/10} lb; purchase ${units} packers rather than underbuying.`}
        }else{
          const unit=effectiveUnit(k,o);units=Math.max(1,Math.ceil(bought/unit));buyWeight=units*unit;
        }
        excess=Math.max(0,buyWeight-bought);
        if(!purchaseNote)purchaseNote=(typeof cutNote==="function"?cutNote(k,o):"")||((excess>.5)?`Purchase amount is rounded to practical units; approximately ${Math.round(excess*10)/10} lb becomes planned leftovers.`:"Purchase amount is rounded to a practical unit.")
      }else if(k==="hog")purchaseNote="Buy one whole hog; target the calculated hanging-weight requirement.";

      if(k==="chicken"&&choices[k]==="whole")purchaseNote="Meatfest planning unit: about 5 lb per whole chicken.";
      const buy=buyOverride||purchaseText(k,units,buyWeight,o);
      rows.push({k,m,o,finished,targetFinished,y,bought,units,buyWeight,excess,purchaseNote,buyOverride,buy,unitBased,servingTarget,servingUnit})
    });
    return {adults,kids,eaters,rows,total:rows.reduce((s,r)=>s+r.buyWeight,0),multiplier:mult,takeRate:TAKE_RATE,servingLb:serving}
  }

  function render(s){
    $("statAdults").textContent=s.adults;$("statKids").textContent=s.kids;$("statEaters").textContent=Math.round(s.eaters*10)/10;
    $("totalRaw").textContent=s.total?`${Math.ceil(s.total*10)/10} lb`:"0 lb";
    $("summary").textContent=s.rows.length?`${s.rows.length} protein${s.rows.length>1?"s":""} • ${Math.round(s.eaters*10)/10} adult-equivalent eaters${planningMode==="family"?" • 10–15% family cushion":""}`:"Select at least one protein.";
    $("results").innerHTML=s.rows.length?s.rows.map(r=>{
      const excess=r.excess>.5?` • Planned excess: <span class="excess">${Math.round(r.excess*10)/10} lb</span>`:"";
      const cushion=planningMode==="family"?` • Family cushion target: <b>${Math.round((r.targetFinished-r.finished)*10)/10} lb finished</b>`:"";
      const detail=r.unitBased
        ?`Serving target: <b>~${Math.round(r.servingTarget)} ${r.servingUnit}</b> • Purchase weight: <b>${Math.round(r.buyWeight*10)/10} lb</b>`
        :`Finished meat needed: <b>${Math.round(r.finished*10)/10} lb</b>${cushion} • Raw requirement: <b>${Math.round(r.bought*10)/10} lb</b>${excess}`;
      return `<div class="result"><div class="resultTop"><div><div class="resultTitle">${r.m.name}</div><span class="pill">${r.o.label}</span><span class="pill">${Math.round(r.y*100)}% yield</span></div><div class="buy">${r.buy}</div></div><div class="details">${detail}</div>${r.purchaseNote?`<div class="purchaseNote">${r.purchaseNote}</div>`:""}${r.k==="hog"&&typeof wholeHogWarning==="function"?wholeHogWarning(r.buyWeight):""}</div>`
    }).join(""):"<p class='note'>Select at least one protein.</p>";
    calcSides()
  }

  window.calc=function(){render(calculateRows())};
  window.buildSummary=function(){const s=calculateRows();return {adults:s.adults,kids:s.kids,eaters:s.eaters,rows:s.rows,total:s.total,multiplier:s.multiplier,takeRate:s.takeRate,servingLb:s.servingLb}};
  setTimeout(function(){if(typeof renderMeats==="function")renderMeats();if(typeof renderSideCards==="function")renderSideCards();calc()},0)
})();

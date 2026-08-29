/* FSDC Meatfest — single authoritative Meatfest calculation layer.
 *
 * This file intentionally owns the visible Meatfest shopping calculation.
 * Do not patch the calculation from multiple extension files.
 * Canonical standard scenario at 48 adult-equivalent eaters:
 *   brisket ~19–20 lb, PMBE 4 x 4-lb chuck roasts,
 *   pulled pork 2 butts, chicken 4 x 5-lb birds,
 *   ribs 5 racks, Polish/brats ~8 half-lb links.
 */
(function(){
  const STANDARD_SERVING = 1/3;
  const MEAT_PORTION_FACTOR = 0.60;
  const RIBS_TAKE_RATE = 0.60;
  const RIBS_PER_TAKER = 1.75;
  const RIBS_PER_RACK = 11;
  const BRAT_LINK_LB = 0.50;
  const BRATS_PER_EATER = 1/6;

  function meatFactor(){
    const s=Number($("serving").value)||STANDARD_SERVING;
    return MEAT_PORTION_FACTOR*(s/STANDARD_SERVING);
  }
  function adultEq(){
    const [a,k]=activeTotals();
    return {adults:a,kids:k,eaters:a+k*0.5};
  }
  function round1(x){return Math.round(x*10)/10}
  function roundUp(x,unit){return Math.max(1,Math.ceil((x-1e-9)/unit))}

  function rowFor(k,eaters){
    const m=meats[k],o=m.options[choices[k]];
    const factor=meatFactor();
    let finished, bought, units, buyWeight, buy, note="", excess=0;

    // Ribs are a piece-count protein, not a weight-distribution protein.
    if(k==="ribs"){
      const ribs=eaters*RIBS_TAKE_RATE*RIBS_PER_TAKER;
      units=roundUp(ribs/RIBS_PER_RACK,1);
      buyWeight=units*o.unitWeight;
      finished=units*o.unitWeight*o.yield;
      bought=ribs/RIBS_PER_RACK*o.unitWeight;
      buy=`BUY ${units} racks (~${round1(buyWeight)} lb total)`;
      excess=Math.max(0,buyWeight-bought);
      note=`Count-based planning: ${round1(eaters*RIBS_TAKE_RATE)} takers × ${RIBS_PER_TAKER} ribs ÷ ${RIBS_PER_RACK} ribs/rack.`;
      return {k,m,o,finished,bought,units,buyWeight,buy,note,excess};
    }

    // Polish/brats retain the established Meatfest half-pound-link planning
    // unit. They are a small feature/secondary protein, not a full 1/3-lb
    // finished-meat allocation.
    if(k==="brats"){
      units=roundUp(eaters*BRATS_PER_EATER,1);
      buyWeight=units*BRAT_LINK_LB;
      finished=buyWeight*o.yield;
      bought=buyWeight;
      buy=`BUY ${units} half-lb link${units===1?"":"s"} (~${round1(buyWeight)} lb total)`;
      note="Established Meatfest sausage planning unit: about one ½-lb link per six adult-equivalent eaters.";
      return {k,m,o,finished,bought,units,buyWeight,buy,note,excess:0};
    }

    // Every selected weight-based protein receives the same share of the
    // selected portion target: 60% of the chosen per-person portion.
    finished=eaters*factor;
    if(o.yield==="hog"){
      const hp=wholeHogPlan(planningMode==="family"?finished*1.125:finished);
      bought=hp.hangingWeight; buyWeight=bought; units=1;
      buy=`BUY 1 whole hog (~${Math.ceil(buyWeight)} lb hanging weight)`;
      note="Whole Hog is a feature-protein scenario.";
      return {k,m,o,finished,bought,units,buyWeight,buy,note,excess:0};
    }

    bought=finished/o.yield;

    // Meatfest uses established large-group purchase rules, not generic
    // per-protein rounding. Brisket is one packer sized near the requirement.
    if(k==="brisket"&&choices[k]==="packer"){
      buyWeight=Math.max(14,Math.ceil((bought-1e-9)/1)*1);
      units=1;
      buy=`BUY 1 packer (~${Math.ceil(buyWeight)} lb; ask for a 19–20 lb packer)`;
      note="Whole packer is treated as one practical purchase; do not turn a ~19–20 lb requirement into two 14-lb packers.";
      excess=Math.max(0,buyWeight-bought);
    }else if(k==="pork"){
      const unit=choices[k]==="boneless"?8:8.5;
      units=roundUp(bought,unit); buyWeight=units*unit;
      buy=`BUY ${units} ${choices[k]==="boneless"?"boneless shoulder":"bone-in butt"}${units===1?"":"s"} (~${round1(buyWeight)} lb total)`;
      note="Purchase is rounded to practical butt/shoulder units; excess is planned leftovers.";
      excess=Math.max(0,buyWeight-bought);
    }else if(k==="chicken"&&o.unit==="whole fryer"){
      const unit=5;
      units=roundUp(bought,unit); buyWeight=units*unit;
      buy=`BUY ${units} whole chicken${units===1?"":"s"} (~${round1(buyWeight)} lb total)`;
      note="Canonical Meatfest whole-chicken planning unit: 5 lb per bird.";
      excess=Math.max(0,buyWeight-bought);
    }else if(k==="pmbe"){
      const unit=4;
      units=roundUp(bought,unit); buyWeight=units*unit;
      buy=`BUY ${units} chuck roast${units===1?"":"s"} (~${round1(buyWeight)} lb total)`;
      note="Canonical PMBE planning unit: 4 lb chuck roast.";
      excess=Math.max(0,buyWeight-bought);
    }else if(o.mode==="units"){
      const unit=o.unitWeight||1;
      units=roundUp(bought,unit); buyWeight=units*unit;
      buy=`BUY ${units} ${o.unit}${units===1?"":"s"} (~${round1(buyWeight)} lb total)`;
      note=o.note||"Purchase amount is rounded to practical units; excess is planned leftovers.";
      excess=Math.max(0,buyWeight-bought);
    }else{
      buyWeight=bought; buy=`BUY ${round1(buyWeight)} lb`;
      note=o.note||"";
    }
    return {k,m,o,finished,bought,units,buyWeight,buy,note,excess};
  }

  function calculateRows(){
    const t=adultEq(), rows=[...selected].map(k=>rowFor(k,t.eaters));
    return {...t,rows,total:rows.reduce((s,r)=>s+r.buyWeight,0)};
  }

  window.calc=function(){
    const s=calculateRows();
    $("statAdults").textContent=s.adults;
    $("statKids").textContent=s.kids;
    $("statEaters").textContent=round1(s.eaters);
    $("totalRaw").textContent=s.total?`${round1(s.total)} lb`:"0 lb";
    $("summary").textContent=s.rows.length?`${s.rows.length} protein${s.rows.length>1?"s":""} • ${round1(s.eaters)} adult-equivalent eaters${planningMode==="family"?" • 10–15% family cushion":""}`:"Select at least one protein.";
    $("results").innerHTML=s.rows.length?s.rows.map(r=>{
      const ex=r.excess>.5?` • Planned excess: <span class="excess">${round1(r.excess)} lb</span>`:"";
      const unit=(r.k!=="ribs"&&r.k!=="brats"&&r.o.mode==="units"&&r.k!=="hog")?` • Planning unit: ${r.k==="chicken"&&r.o.unit==="whole fryer"?5:r.k==="pmbe"?4:r.k==="pork"?(choices[r.k]==="boneless"?8:8.5):r.o.unitWeight} lb`:"";
      return `<div class="result"><div class="resultTop"><div><div class="resultTitle">${r.m.name}</div><span class="pill">${r.o.label}</span><span class="pill">${Math.round(r.o.yield*100)}% yield</span></div><div class="buy">${r.buy}</div></div><div class="details">Finished meat needed: <b>${round1(r.finished)} lb</b> • Raw requirement: <b>${round1(r.bought)} lb</b>${unit}${ex}</div>${r.note?`<div class="purchaseNote">${r.note}</div>`:""}</div>`;
    }).join(""):"<p class='note'>Select at least one protein.</p>";
    calcSides();
  };

  window.buildSummary=function(){
    const s=calculateRows();
    return {adults:s.adults,kids:s.kids,eaters:s.eaters,rows:s.rows,total:s.total};
  };

  // Final override runs after any browser-loaded legacy code. This is a
  // deliberate last-writer guard while old cached clients transition.
  setTimeout(function(){
    if(meats.chicken&&meats.chicken.options.whole){
      meats.chicken.options.whole.unitWeight=5;
      meats.chicken.options.whole.unit="whole chicken";
    }
    if(meats.brats&&meats.brats.options.links){
      meats.brats.options.links.unitWeight=.5;
      meats.brats.options.links.unit="link";
    }
    if(typeof renderMeats==="function")renderMeats();
    if(typeof renderSideCards==="function")renderSideCards();
    calc();
  },0);
})();

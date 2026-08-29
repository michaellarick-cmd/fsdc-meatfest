/* FSDC Meatfest — one authoritative Meatfest purchase calculator.
 *
 * IMPORTANT: this is the Meatfest planning model, not a generic equal-share
 * catering calculator. The 48 adult-equivalent anchor was the validated
 * planning scenario:
 *   brisket: one 19–20 lb packer
 *   PMBE: 4 x 4-lb chuck roasts
 *   pulled pork: 2 x 8.5-lb butts
 *   ribs: 5 racks
 *   Polish/brats: 8 x 0.5-lb links
 *   chicken: 4 x 5-lb whole fryers
 *
 * The selected Light / Standard / Generous portion setting scales that anchor.
 * Practical purchase units are then rounded UP. Ribs and sausage remain
 * count-based because they are served as pieces.
 */
(function(){
  const BASE_EATERS = 48;
  const STANDARD_SERVING = 1/3;
  const BRISKET_BASE_LB = 19.5;
  const PMBE_BASE_LB = 16;
  const PORK_BASE_LB = 17;
  const CHICKEN_BASE_BIRDS = 4;
  const CHICKEN_LB = 5;
  const PMBE_UNIT_LB = 4;
  const PORK_UNIT_LB = 8.5;
  const BRAT_LINK_LB = .5;
  const BRATS_PER_EATER = 1/6;
  const RIBS_TAKE_RATE = .60;
  const RIBS_PER_TAKER = 1.75;
  const RIBS_PER_RACK = 11;
  const RIB_RACK_LB = 2.25;

  function round1(x){ return Math.round(x*10)/10; }
  function roundUp(x, unit){ return Math.max(1, Math.ceil((x-1e-9)/unit)); }
  function activeEaters(){
    const [adults,kids] = activeTotals();
    return { adults, kids, eaters: adults + kids*.5 };
  }
  function portionFactor(){
    const s = Number($("serving").value) || STANDARD_SERVING;
    return s / STANDARD_SERVING;
  }

  function rowFor(k, eaters){
    const m = meats[k], o = m.options[choices[k]];
    const scale = (eaters / BASE_EATERS) * portionFactor();
    let finished, raw, units, buyWeight, buy, note = "", excess = 0;

    // Ribs are piece-count based: 60% of guests x 1.75 ribs each,
    // converted to practical 11-rib racks.
    if(k === "ribs"){
      const ribsNeeded = eaters * RIBS_TAKE_RATE * RIBS_PER_TAKER * portionFactor();
      units = roundUp(ribsNeeded / RIBS_PER_RACK, 1);
      buyWeight = units * RIB_RACK_LB;
      raw = ribsNeeded / RIBS_PER_RACK * RIB_RACK_LB;
      finished = buyWeight * .70;
      buy = `BUY ${units} rack${units===1?"":"s"} (~${round1(buyWeight)} lb total)`;
      excess = Math.max(0, buyWeight - raw);
      note = `Count-based planning: ${round1(eaters*RIBS_TAKE_RATE*portionFactor())} takers × ${RIBS_PER_TAKER} ribs ÷ ${RIBS_PER_RACK} ribs/rack.`;
      return {k,m,o,finished,bought:raw,units,buyWeight,buy,note,excess};
    }

    // Polish/brats are the established 1/2-lb link planning unit.
    if(k === "brats"){
      units = roundUp(eaters * BRATS_PER_EATER * portionFactor(), 1);
      buyWeight = units * BRAT_LINK_LB;
      raw = eaters * BRATS_PER_EATER * portionFactor() * BRAT_LINK_LB;
      finished = buyWeight * .90;
      buy = `BUY ${units} half-lb link${units===1?"":"s"} (~${round1(buyWeight)} lb total)`;
      note = "Established Meatfest sausage planning unit: about one ½-lb link per six adult-equivalent eaters.";
      return {k,m,o,finished,bought:raw,units,buyWeight,buy,note,excess:0};
    }

    // Weight-based Meatfest anchors. These are NOT divided equally among
    // selected proteins; each protein has its own validated purchase role.
    if(k === "brisket" && choices[k] === "packer"){
      raw = BRISKET_BASE_LB * scale;
      buyWeight = Math.max(14, raw);
      units = 1;
      finished = raw * .50;
      buy = `BUY 1 packer (~${round1(buyWeight)} lb; ask for a 19–20 lb packer)`;
      excess = Math.max(0, buyWeight - raw);
      note = "Meatfest anchor: one practical whole packer; do not split a 19–20 lb requirement into multiple small packers.";
      return {k,m,o,finished,bought:raw,units,buyWeight,buy,note,excess};
    }

    if(k === "pmbe"){
      raw = PMBE_BASE_LB * scale;
      units = roundUp(raw, PMBE_UNIT_LB);
      buyWeight = units * PMBE_UNIT_LB;
      finished = raw * .60;
      buy = `BUY ${units} chuck roast${units===1?"":"s"} (~${round1(buyWeight)} lb total)`;
      excess = Math.max(0, buyWeight - raw);
      note = "Meatfest PMBE anchor: four 4-lb chuck roasts at 48 adult-equivalent eaters.";
      return {k,m,o,finished,bought:raw,units,buyWeight,buy,note,excess};
    }

    if(k === "pork"){
      raw = PORK_BASE_LB * scale;
      units = roundUp(raw, PORK_UNIT_LB);
      buyWeight = units * PORK_UNIT_LB;
      finished = raw * .60;
      buy = `BUY ${units} bone-in butt${units===1?"":"s"} (~${round1(buyWeight)} lb total)`;
      excess = Math.max(0, buyWeight - raw);
      note = "Meatfest pulled-pork anchor: two 8.5-lb bone-in butts at 48 adult-equivalent eaters.";
      return {k,m,o,finished,bought:raw,units,buyWeight,buy,note,excess};
    }

    if(k === "chicken" && o.unit === "whole fryer"){
      const birdsNeeded = CHICKEN_BASE_BIRDS * scale;
      units = roundUp(birdsNeeded, 1);
      buyWeight = units * CHICKEN_LB;
      raw = birdsNeeded * CHICKEN_LB;
      finished = raw * .62;
      buy = `BUY ${units} whole chicken${units===1?"":"s"} (~${round1(buyWeight)} lb total)`;
      excess = Math.max(0, buyWeight - raw);
      note = "Meatfest whole-chicken anchor: four 5-lb fryers at 48 adult-equivalent eaters.";
      return {k,m,o,finished,bought:raw,units,buyWeight,buy,note,excess};
    }

    // Fallback for other proteins retained by the existing UI.
    const unit = Number(o.unitWeight) > 0 ? Number(o.unitWeight) : 1;
    const yieldRate = typeof o.yield === "number" ? o.yield : 1;
    raw = eaters * Number($("serving").value || STANDARD_SERVING) / Math.max(1, [...selected].length);
    units = roundUp(raw / yieldRate, unit);
    buyWeight = units * unit;
    finished = raw;
    buy = `BUY ${units} ${o.unit}${units===1?"":"s"} (~${round1(buyWeight)} lb total)`;
    excess = Math.max(0, buyWeight - raw/yieldRate);
    note = o.note || "Purchase amount is rounded to a practical unit.";
    return {k,m,o,finished,bought:raw/yieldRate,units,buyWeight,buy,note,excess};
  }

  function calculateRows(){
    const t = activeEaters();
    const rows = [...selected].map(k => rowFor(k, t.eaters));
    return {...t, rows, total: rows.reduce((s,r)=>s+r.buyWeight,0)};
  }

  window.calc = function(){
    const s = calculateRows();
    $("statAdults").textContent = s.adults;
    $("statKids").textContent = s.kids;
    $("statEaters").textContent = round1(s.eaters);
    $("totalRaw").textContent = s.total ? `${round1(s.total)} lb` : "0 lb";
    $("summary").textContent = s.rows.length ? `${s.rows.length} protein${s.rows.length>1?"s":""} • ${round1(s.eaters)} adult-equivalent eaters${planningMode==="family"?" • 10–15% family cushion":""}` : "Select at least one protein.";
    $("results").innerHTML = s.rows.length ? s.rows.map(r => {
      const ex = r.excess > .5 ? ` • Planned excess: <span class="excess">${round1(r.excess)} lb</span>` : "";
      const unit = (r.k!=="ribs" && r.k!=="brats" && r.o.mode==="units" && r.k!=="hog") ? ` • Planning unit: ${r.k==="chicken"&&r.o.unit==="whole fryer"?5:r.k==="pmbe"?4:r.k==="pork"?8.5:r.o.unitWeight} lb` : "";
      return `<div class="result"><div class="resultTop"><div><div class="resultTitle">${r.m.name}</div><span class="pill">${r.o.label}</span><span class="pill">${Math.round((typeof r.o.yield==="number"?r.o.yield:1)*100)}% yield</span></div><div class="buy">${r.buy}</div></div><div class="details">Finished meat needed: <b>${round1(r.finished)} lb</b> • Raw requirement: <b>${round1(r.bought)} lb</b>${unit}${ex}</div>${r.note?`<div class="purchaseNote">${r.note}</div>`:""}</div>`;
    }).join("") : "<p class='note'>Select at least one protein.</p>";
    calcSides();
  };

  window.buildSummary = function(){
    const s = calculateRows();
    return {adults:s.adults,kids:s.kids,eaters:s.eaters,rows:s.rows,total:s.total};
  };

  // Last-writer guard for any older cached calculation layer.
  setTimeout(function(){
    if(meats.chicken && meats.chicken.options.whole){
      meats.chicken.options.whole.unitWeight = 5;
      meats.chicken.options.whole.unit = "whole fryer";
    }
    if(meats.brats && meats.brats.options.links){
      meats.brats.options.links.unitWeight = .5;
      meats.brats.options.links.unit = "link";
    }
    if(typeof renderMeats === "function") renderMeats();
    if(typeof renderSideCards === "function") renderSideCards();
    calc();
  },0);
})();

/* Meatfest calculation lock — authoritative recommendation engine.
 *
 * UI/configuration is intentionally unchanged. This file owns only the
 * protein Recommended Buy calculation.
 *
 * Model:
 *   1. Establish total finished-meat consumption from adult-equivalents.
 *   2. Distribute that total across selected proteins using Meatfest-specific
 *      consumption weights (not one full serving target per protein).
 *   3. Apply the original Meatfest yield assumptions from the established
 *      calculator model.
 *   4. Round to practical purchase units. The rounding itself supplies the
 *      intentional Meatfest cushion; we do not multiply the whole menu by an
 *      arbitrary leftover percentage.
 *
 * Serving behavior behind the weights:
 *   PMBE          ~2 cubes/person when selected
 *   Pork belly    ~2 cubes/person when selected
 *   Ribs          ~2–3 king-cut ribs for people choosing ribs
 *   Brats         ~3–4 sliced bites for people choosing brats
 *   Brisket       ~2–3 lean slices, with a smaller fatty take-rate
 *   Pulled meats  ~1 scoop, about 1/3 lb
 *
 * The weights are deliberately normalized over the proteins actually chosen.
 * They therefore represent the share of the TOTAL Meatfest meat consumption,
 * rather than multiplying the total by the number of proteins selected.
 *
 * IMPORTANT: brat/Polish sausage purchase weight is 0.5 lb/link, matching the
 * original measured Meatfest spreadsheet data. Do not replace with 0.25 lb.
 */
(function(){
  const ROLE_WEIGHT=Object.freeze({brisket:.22,pork:.18,chicken:.15,ribs:.15,brats:.12,pmbe:.10,porkbelly:.08,prime:.10,turkey:.12,fish:.08,hog:1});
  const YIELD=Object.freeze({chicken:.62,fish:.76,pork:.60,brats:.90,brisket:.50,pmbe:.60,prime:.80,ribs:.70,porkbelly:.62,turkey:.55});
  const UNIT=Object.freeze({chicken:5,fish:.33,pork:8.5,brats:.50,brisket:14,pmbe:4,prime:5,ribs:2.75,porkbelly:10,turkey:14});
  function servingTarget(){const v=Number($("serving").value);return v===.25||v===.5?v:1/3}
  function activeEaters(){const [adults,kids]=activeTotals();return {adults,kids,eaters:adults+kids*.5}}
  function normalizeWeights(keys){if(keys.includes("hog")){const o={};keys.forEach(k=>o[k]=k==="hog"?1:0);return o}const total=keys.reduce((s,k)=>s+(ROLE_WEIGHT[k]||0),0),o={};keys.forEach(k=>o[k]=total?(ROLE_WEIGHT[k]||0)/total:1/keys.length);return o}
  function effectiveYield(k,o){return o&&typeof o.yield==="number"?o.yield:(YIELD[k]||1)}
  function effectiveUnit(k,o){if(k==="chicken"&&choices[k]==="whole")return 5;if(k==="brats")return .50;if(k==="ribs")return 2.75;if(k==="porkbelly")return 10;if(k==="brisket"&&choices[k]==="packer")return 14;if(k==="pmbe")return 4;if(o&&Number.isFinite(Number(o.unitWeight)))return Number(o.unitWeight);return UNIT[k]||1}
  function roundUnits(raw,unit){return Math.max(1,Math.ceil((raw-1e-9)/unit))}
  function purchaseText(k,units,weight,o){if(k==="brisket"&&choices[k]==="packer")return `BUY ${units} whole packer${units===1?"":"s"} (~${units*14}–${units*18} lb total)`;if(k==="brats")return `BUY ${units} link${units===1?"":"s"} (~${Math.round(weight*10)/10} lb total)`;if(k==="chicken"&&choices[k]==="whole")return `BUY ${units} whole chicken${units===1?"":"s"} (~${Math.round(weight*10)/10} lb total)`;if(k==="pmbe")return `BUY ${units} chuck roast${units===1?"":"s"} (~${Math.round(weight*10)/10} lb total)`;if(k==="ribs")return `BUY ${units} rack${units===1?"":"s"} (~${Math.round(weight*10)/10} lb total)`;if(k==="porkbelly")return `BUY ${units} whole skinless pork belly${units===1?"":"s"} (~${Math.round(weight*10)/10} lb total)`;if(k==="pork")return `BUY ${units} ${o.unit}${units===1?"":"s"} (~${Math.round(weight*10)/10} lb total)`;if(k==="fish")return `BUY ${units} ${o.unit}${units===1?"":"s"} (~${Math.round(weight*10)/10} lb total)`;if(k==="hog")return `BUY 1 whole hog (~${Math.ceil(weight)} lb hanging weight)`;return `BUY ${units} ${o.unit}${units===1?"":"s"} (~${Math.round(weight*10)/10} lb total)`}
  function noteFor(k,raw,buyWeight){const excess=Math.max(0,buyWeight-raw);if(k==="porkbelly")return "Rich secondary protein. Whole belly is a practical batch; portion and freeze excess for a future cook.";if(excess>.5)return `Purchase is rounded to practical units; approximately ${Math.round(excess*10)/10} lb becomes planned leftovers.`;return "Purchase amount is rounded to a practical unit."}
  function calculateRows(){const {adults,kids,eaters}=activeEaters(),keys=[...selected];if(!eaters||!keys.length)return {adults,kids,eaters,totalFinishedTarget:0,rows:[],total:0};const totalFinishedTarget=eaters*servingTarget(),weights=normalizeWeights(keys),rows=[];keys.forEach(k=>{const m=meats[k],o=m.options[choices[k]],share=weights[k]||0,finished=totalFinishedTarget*share,targetFinished=planningMode==="family"?finished*1.125:finished;if(k==="hog"){const plan=typeof wholeHogPlan==="function"?wholeHogPlan(targetFinished):{hangingWeight:targetFinished,yield:.50},buyWeight=plan.hangingWeight;rows.push({k,m,o,finished,targetFinished,y:plan.yield,bought:buyWeight,units:1,buyWeight,excess:0,purchaseNote:"Whole hog remains a feature protein and is not combined with the other-protein allocation.",buyOverride:`BUY 1 whole hog (~${Math.ceil(buyWeight)} lb hanging weight)`});return}const y=effectiveYield(k,o),raw=targetFinished/y,unit=effectiveUnit(k,o),units=roundUnits(raw,unit),buyWeight=units*unit;rows.push({k,m,o,finished,targetFinished,y,bought:raw,units,buyWeight,excess:Math.max(0,buyWeight-raw),purchaseNote:noteFor(k,raw,buyWeight),buyOverride:null})});return {adults,kids,eaters,totalFinishedTarget,rows,total:rows.reduce((s,r)=>s+r.buyWeight,0)}}
  function render(s){$("statAdults").textContent=s.adults;$("statKids").textContent=s.kids;$("statEaters").textContent=Math.round(s.eaters*10)/10;$("totalRaw").textContent=s.total?`${Math.ceil(s.total*10)/10} lb`:"0 lb";$("summary").textContent=s.rows.length?`${s.rows.length} protein${s.rows.length>1?"s":""} • ${Math.round(s.eaters*10)/10} adult-equivalent eaters${planningMode==="family"?" • 10–15% family cushion":""}`:"Select at least one protein.";$("results").innerHTML=s.rows.length?s.rows.map(r=>{const buy=r.buyOverride||purchaseText(r.k,r.units,r.buyWeight,r.o),excess=r.excess>.5?` • Planned excess: <span class="excess">${Math.round(r.excess*10)/10} lb</span>`:"",cushion=planningMode==="family"?` • Family cushion target: <b>${Math.round((r.targetFinished-r.finished)*10)/10} lb finished</b>`:"";return `<div class="result"><div class="resultTop"><div><div class="resultTitle">${r.m.name}</div><span class="pill">${r.o.label}</span><span class="pill">${Math.round(r.y*100)}% yield</span></div><div class="buy">${buy}</div></div><div class="details">Finished meat needed: <b>${Math.round(r.finished*10)/10} lb</b>${cushion} • Raw requirement: <b>${Math.round(r.bought*10)/10} lb</b>${excess}</div>${r.purchaseNote?`<div class="purchaseNote">${r.purchaseNote}</div>`:""}${r.k==="hog"&&typeof wholeHogWarning==="function"?wholeHogWarning(r.buyWeight):""}</div>`}).join(""):"<p class='note'>Select at least one protein.</p>";calcSides()}
  window.calc=function(){render(calculateRows())};window.buildSummary=function(){const s=calculateRows();return {adults:s.adults,kids:s.kids,eaters:s.eaters,rows:s.rows.map(r=>({...r,buy:r.buyOverride||purchaseText(r.k,r.units,r.buyWeight,r.o)})),total:s.total}};setTimeout(function(){if(typeof renderMeats==="function")renderMeats();calc()},0)
})();

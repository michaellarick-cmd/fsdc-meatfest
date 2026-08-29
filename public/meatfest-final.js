/* Meatfest authoritative calculation pass — v2.2.6
 *
 * The important rule here is that the selected serving amount is the TOTAL
 * finished-meat target per adult-equivalent eater. Additional proteins reduce
 * that total; the total is then divided equally across the selected proteins.
 * Each protein then applies its own yield and practical purchase unit.
 *
 * This file also re-runs the authoritative calculation after the legacy app's
 * event handlers. The old app.js remains useful for UI/state management, but
 * it must not be allowed to put its older protein math back on screen.
 */
(function(){
  const TAKE_RATE=.60;
  const VERSION="2.2.6";

  function active(){
    const [adults,kids]=activeTotals();
    return {
      adults:Number(adults)||0,
      kids:Number(kids)||0,
      eaters:(Number(adults)||0)+(Number(kids)||0)*.5
    };
  }

  function serving(){
    const v=Number($("serving")?.value);
    return v===.25||v===.5||Math.abs(v-1/3)<.001?v:1/3;
  }

  function multiplier(n){
    return n<1?0:Math.max(.60,1-.15*(n-1));
  }

  function unitWeight(k,o){
    if(k==="chicken"&&choices[k]==="whole")return Number(o.unitWeight)||4.5;
    if(k==="brats")return .5;
    if(k==="ribs")return 2.25;
    if(k==="brisket"&&choices[k]==="packer")return 14;
    if(k==="pmbe")return 4;
    return Number.isFinite(Number(o.unitWeight))?Number(o.unitWeight):1;
  }

  function purchase(k,o,raw){
    if(k==="brisket"&&choices[k]==="packer"){
      if(raw<=14)return {units:1,weight:14,buy:"BUY 1 packer (~14–18 lb total)",note:"One whole packer is the practical Meatfest purchase unit."};
      if(raw<=18)return {units:1,weight:Math.ceil(raw),buy:`BUY 1 oversized packer (~${Math.ceil(raw)} lb target)`,note:`Raw target is ${raw.toFixed(1)} lb; use one oversized whole packer if available.`};
      const units=Math.ceil(raw/18);
      return {units,weight:Math.max(raw,units*14),buy:`BUY ${units} whole packers`,note:`Raw target is ${raw.toFixed(1)} lb; multiple packers are required.`};
    }
    const unit=unitWeight(k,o);
    const units=Math.max(1,Math.ceil((raw-1e-9)/unit));
    return {units,weight:units*unit,buy:null,note:null};
  }

  function buyText(k,o,p){
    if(p.buy)return p.buy;
    if(k==="chicken"&&choices[k]==="whole")return `BUY ${p.units} whole fryer${p.units===1?"":"s"} (~${Math.round(p.weight*10)/10} lb total)`;
    if(k==="pmbe")return `BUY ${p.units} chuck roast${p.units===1?"":"s"} (~${Math.round(p.weight*10)/10} lb total)`;
    if(k==="ribs")return `BUY ${p.units} rack${p.units===1?"":"s"} (~${Math.round(p.weight*10)/10} lb total)`;
    if(k==="brats")return `BUY ${p.units} link${p.units===1?"":"s"} (~${Math.round(p.weight*10)/10} lb total)`;
    return `BUY ${p.units} ${o.unit}${p.units===1?"":"s"} (~${Math.round(p.weight*10)/10} lb total)`;
  }

  function calculateMeatfest(){
    const {adults,kids,eaters}=active();
    const keys=[...selected];
    if(!eaters||!keys.length)return {adults,kids,eaters,rows:[],total:0,multiplier:0,servingLb:serving(),takeRate:TAKE_RATE,totalFinished:0};
    if(keys.includes("hog"))return null;

    const portion=serving();
    const mult=multiplier(keys.length);
    const totalFinished=eaters*portion*mult;
    const finishedPerProtein=totalFinished/keys.length;
    const rows=[];

    keys.forEach(k=>{
      const m=meats[k],o=m.options[choices[k]];
      const y=Number(o.yield)>0?Number(o.yield):1;
      const finished=finishedPerProtein;
      const raw=finished/y;
      const p=purchase(k,o,raw);
      let note=p.note||"";
      if(!note&&p.weight>raw+.5)note=`Purchase amount is rounded to the practical unit; ${Math.round((p.weight-raw)*10)/10} lb becomes planned leftovers.`;
      if(k==="chicken"&&choices[k]==="whole")note="Meatfest planning unit: about 4.5 lb per whole fryer.";
      rows.push({k,m,o,y,finished,raw,units:p.units,buyWeight:p.weight,buy:buyText(k,o,p),purchaseNote:note,excess:Math.max(0,p.weight-raw)});
    });

    return {adults,kids,eaters,rows,total:rows.reduce((s,r)=>s+r.buyWeight,0),multiplier:mult,servingLb:portion,takeRate:TAKE_RATE,totalFinished};
  }

  function renderFinal(s){
    $("statAdults").textContent=s.adults;
    $("statKids").textContent=s.kids;
    $("statEaters").textContent=Math.round(s.eaters*10)/10;
    $("totalRaw").textContent=s.total?`${Math.ceil(s.total*10)/10} lb`:"0 lb";
    $("summary").textContent=s.rows.length?`${s.rows.length} protein${s.rows.length>1?"s":""} • ${Math.round(s.eaters*10)/10} adult-equivalent eaters`:`Select at least one protein.`;
    const box=$("results");
    if(!box)return;
    box.innerHTML=s.rows.length?s.rows.map(r=>`<div class="result"><div class="resultTop"><div><div class="resultTitle">${r.m.name}</div><span class="pill">${r.o.label}</span><span class="pill">${Math.round(r.y*100)}% yield</span></div><div class="buy">${r.buy}</div></div><div class="details">Finished meat needed: <b>${Math.round(r.finished*10)/10} lb</b> • Raw requirement: <b>${Math.round(r.raw*10)/10} lb</b> • Planned excess: <span class="excess">${Math.round(r.excess*10)/10} lb</span></div>${r.purchaseNote?`<div class="purchaseNote">${r.purchaseNote}</div>`:""}</div>`).join(""):"<p class='note'>Select at least one protein.</p>";
    if(typeof calcSides==="function")calcSides();
  }

  function authoritativeCalc(){
    if(typeof planningMode!=="undefined"&&planningMode!=="meatfest")return;
    const s=calculateMeatfest();
    if(s)renderFinal(s);
    return s;
  }

  // Replace the global property used by save/print/share paths.
  window.calc=authoritativeCalc;
  window.buildSummary=function(){
    const s=calculateMeatfest();
    return s?{adults:s.adults,kids:s.kids,eaters:s.eaters,rows:s.rows,total:s.total,multiplier:s.multiplier,servingLb:s.servingLb,takeRate:s.takeRate,totalFinished:s.totalFinished}:{};
  };

  // app.js contains older inline handlers that can run after this file.
  // Reconcile after those handlers finish so the old calculation cannot
  // overwrite the authoritative result. This is intentionally delegated and
  // does not replace the app's UI/state handlers.
  let queued=false;
  function reconcile(){
    if(queued)return;
    queued=true;
    setTimeout(function(){queued=false;try{authoritativeCalc()}catch(e){console.error("Meatfest authority reconciliation failed",e)}},0);
  }
  document.addEventListener("input",reconcile);
  document.addEventListener("change",reconcile);
  document.addEventListener("click",function(e){
    if(e.target.closest("[data-plan-mode],[data-serving-choice],.meat,[data-choice],[data-side],#manualTab,#guestTab,#clearGuests,#importPaste"))reconcile();
  });

  function installFinalUI(){
    const eyebrow=document.querySelector(".eyebrow");if(eyebrow)eyebrow.textContent=`MEATFEST • VERSION ${VERSION}`;
    const footer=document.querySelector(".footer");if(footer)footer.textContent=`FSDC Meatfest Calculator • v${VERSION} • Authoritative portion model`;
    document.title=`FSDC Meatfest Calculator ${VERSION}`;
    const note=document.querySelector("#serving")?.parentElement;
    if(note&&!document.getElementById("meatfestPortionNote")){
      const el=document.createElement("div");
      el.id="meatfestPortionNote";
      el.className="meatfestPortionNote";
      el.innerHTML='<b>Important:</b> the selected portion is the total finished-meat target per eater. When more proteins are selected, that total is reduced and then divided equally across the selected proteins.';
      note.appendChild(el);
    }
  }

  installFinalUI();
  setTimeout(function(){
    try{
      if(typeof renderMeats==="function")renderMeats();
      if(typeof renderSideCards==="function")renderSideCards();
      authoritativeCalc();
    }catch(e){console.error("Meatfest authoritative pass failed",e)}
  },0);
})();

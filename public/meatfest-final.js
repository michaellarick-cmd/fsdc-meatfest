/* Meatfest final authoritative pass — v2.2.4 */
(function(){
  if(window.__MEATFEST_FINAL__) return;
  window.__MEATFEST_FINAL__=true;
  const previousCalc=window.calc;
  const previousSummary=window.buildSummary;
  const TAKE_RATE=.60, RIBS_PER_TAKER=1.75, RIBS_PER_RACK=11, SAUSAGE_SLICES_PER_TAKER=3.5, SAUSAGE_SLICES_PER_LINK=12;
  function eaters(){const [adults,kids]=activeTotals();return {adults,kids,eaters:Number(adults)+Number(kids)*.5};}
  function multiplier(n){return n<1?0:Math.max(.60,1-.15*(n-1));}
  function serving(){const v=Number($("serving")?.value);return v===.25||v===.5||v===1/3?v:1/3;}
  function unitWeight(k,o){
    if(k==="chicken"&&choices[k]==="whole")return 4.5;
    if(k==="brats")return .5;
    if(k==="ribs")return 2.25;
    if(k==="brisket"&&choices[k]==="packer")return 14;
    if(k==="pmbe")return 4;
    return Number.isFinite(Number(o.unitWeight))?Number(o.unitWeight):1;
  }
  function purchase(k,o,raw){
    if(k==="brisket"&&choices[k]==="packer"){
      if(raw<=18)return {units:1,weight:14,buy:"BUY 1 packer (~14–18 lb total)",note:"One whole packer is the practical Meatfest purchase unit."};
      if(raw<=22)return {units:1,weight:Math.ceil(raw),buy:`BUY 1 oversized packer (~${Math.ceil(raw)} lb target)`,note:`Raw target is ${raw.toFixed(1)} lb; use one oversized whole packer if available.`};
      const units=Math.ceil(raw/18);return {units,weight:Math.max(raw,units*14),buy:`BUY ${units} whole packers`,note:`Raw target is ${raw.toFixed(1)} lb; multiple packers are required.`};
    }
    const unit=unitWeight(k,o),units=Math.max(1,Math.ceil((raw-1e-9)/unit));
    return {units,weight:units*unit,buy:null,note:null};
  }
  function buyText(k,o,p){
    if(k==="brisket"&&choices[k]==="packer")return p.buy;
    if(k==="chicken"&&choices[k]==="whole")return `BUY ${p.units} whole fryer${p.units===1?"":"s"} (~${Math.round(p.weight*10)/10} lb total)`;
    if(k==="pmbe")return `BUY ${p.units} chuck roast${p.units===1?"":"s"} (~${Math.round(p.weight*10)/10} lb total)`;
    if(k==="ribs")return `BUY ${p.units} rack${p.units===1?"":"s"} (~${Math.round(p.weight*10)/10} lb total)`;
    if(k==="brats")return `BUY ${p.units} link${p.units===1?"":"s"} (~${Math.round(p.weight*10)/10} lb total)`;
    return `BUY ${p.units} ${o.unit}${p.units===1?"":"s"} (~${Math.round(p.weight*10)/10} lb total)`;
  }
  function calculateMeatfest(){
    const {adults,kids,eaters}=eaters(),keys=[...selected];
    if(!eaters||!keys.length)return {adults,kids,eaters,rows:[],total:0,multiplier:0,servingLb:serving(),takeRate:TAKE_RATE};
    if(keys.includes("hog"))return null;
    const portion=serving(),mult=multiplier(keys.length),totalFinished=eaters*portion*mult,finishedPerProtein=totalFinished/keys.length,rows=[];
    keys.forEach(k=>{
      const m=meats[k],o=m.options[choices[k]],y=Number(o.yield)>0?Number(o.yield):1,finished=finishedPerProtein,raw=finished/y;
      let p=purchase(k,o,raw),detail=`Finished meat needed: <b>${Math.round(finished*10)/10} lb</b> • Raw requirement: <b>${Math.round(raw*10)/10} lb</b>`,note=p.note||"";
      if(k==="ribs"){
        const ribTarget=eaters*TAKE_RATE*RIBS_PER_TAKER,units=Math.max(1,Math.ceil(ribTarget/RIBS_PER_RACK));
        p={units,weight:units*unitWeight(k,o)};detail=`Serving target: <b>~${Math.round(ribTarget)} individual ribs</b> • Purchase weight: <b>${Math.round(p.weight*10)/10} lb</b>`;note="Serving rule: 60% take-rate × 1.75 ribs per taker; about 11 ribs per rack.";
      }
      if(k==="brats"){
        const sliceTarget=eaters*TAKE_RATE*SAUSAGE_SLICES_PER_TAKER,units=Math.max(1,Math.ceil(sliceTarget/SAUSAGE_SLICES_PER_LINK));
        p={units,weight:units*.5};detail=`Serving target: <b>~${Math.round(sliceTarget)} half-inch slices</b> • Purchase weight: <b>${Math.round(p.weight*10)/10} lb</b>`;note="Serving rule: 60% take-rate × 3.5 slices per taker; about 12 slices per traditional link.";
      }
      if(k==="chicken"&&choices[k]==="whole")note="Meatfest planning unit: about 4.5 lb per whole fryer.";
      if(!note&&p.weight>raw+.5)note=`Purchase is rounded to the practical unit; ${Math.round((p.weight-raw)*10)/10} lb becomes planned leftovers.`;
      rows.push({k,m,o,finished,raw,y,units:p.units,buyWeight:p.weight,buy:buyText(k,o,p),purchaseNote:note,detail,excess:Math.max(0,p.weight-raw)});
    });
    return {adults,kids,eaters,rows,total:rows.reduce((s,r)=>s+r.buyWeight,0),multiplier:mult,servingLb:portion,takeRate:TAKE_RATE,totalFinished};
  }
  function renderFinal(s){
    $("statAdults").textContent=s.adults;$("statKids").textContent=s.kids;$("statEaters").textContent=Math.round(s.eaters*10)/10;$("totalRaw").textContent=s.total?`${Math.ceil(s.total*10)/10} lb`:"0 lb";
    $("summary").textContent=s.rows.length?`${s.rows.length} protein${s.rows.length>1?"s":""} • ${Math.round(s.eaters*10)/10} adult-equivalent eaters`:`Select at least one protein.`;
    const box=$("results");if(!box)return;
    box.innerHTML=s.rows.length?s.rows.map(r=>`<div class="result"><div class="resultTop"><div><div class="resultTitle">${r.m.name}</div><span class="pill">${r.o.label}</span><span class="pill">${Math.round(r.y*100)}% yield</span></div><div class="buy">${r.buy}</div></div><div class="details">${r.detail}</div>${r.purchaseNote?`<div class="purchaseNote">${r.purchaseNote}</div>`:""}</div>`).join(""):"<p class='note'>Select at least one protein.</p>";
    if(typeof calcSides==="function")calcSides();
  }
  window.calc=function(){if(planningMode!=="meatfest")return previousCalc?previousCalc():undefined;const s=calculateMeatfest();if(!s)return previousCalc?previousCalc():undefined;renderFinal(s);return s;};
  window.buildSummary=function(){if(planningMode!=="meatfest")return previousSummary?previousSummary():{};const s=calculateMeatfest();if(!s)return previousSummary?previousSummary():{};return {adults:s.adults,kids:s.kids,eaters:s.eaters,rows:s.rows,total:s.total,multiplier:s.multiplier,servingLb:s.servingLb,takeRate:s.takeRate,totalFinished:s.totalFinished};};
  function installFinalUI(){
    if(document.getElementById("meatfest-final-ui"))return;
    const style=document.createElement("style");style.id="meatfest-final-ui";style.textContent=`.meatfestPortionNote{margin-top:10px;padding:9px 11px;border-left:3px solid var(--accent);background:#1d1914;color:#d9c7ae;font-size:11px;line-height:1.4;border-radius:0 7px 7px 0}.meatfestPortionNote b{color:#f0eee7}@media(max-width:600px){.meats{grid-template-columns:1fr}.result{padding:12px}.resultTop{align-items:flex-start}.buy{max-width:52%;line-height:1.15}}`;document.head.appendChild(style);
    const note=document.querySelector("#serving")?.parentElement?.parentElement;if(note&&!document.getElementById("meatfestPortionNote")){const el=document.createElement("div");el.id="meatfestPortionNote";el.className="meatfestPortionNote";el.innerHTML='<b>Important:</b> this is the total finished-meat target per eater, not a separate ⅓ lb for every protein. As proteins are added, the total target drops; that total is then divided across the selected proteins.';note.appendChild(el);}
    const title=document.getElementById("pageSub");if(title)title.textContent="Your Meatfest model, turned into a practical shopping list.";const eyebrow=document.querySelector(".eyebrow");if(eyebrow)eyebrow.textContent="MEATFEST • VERSION 2.2.4";document.title="FSDC Meatfest Calculator 2.2.4";
  }
  installFinalUI();
  setTimeout(function(){try{if(typeof renderMeats==="function")renderMeats();if(typeof renderSideCards==="function")renderSideCards();window.calc();}catch(e){console.error("Meatfest final pass failed",e)}},0);
})();

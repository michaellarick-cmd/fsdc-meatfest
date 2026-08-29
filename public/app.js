
const meats={
 chicken:{name:"Chicken / Poultry",default:"whole",options:{
  whole:{label:"Whole Fryer — Pulled",yield:.62,unitWeight:4.5,unit:"whole fryer",mode:"units",note:"Meatfest planning unit: about 4.5 lb per Costco fryer."},
  legq:{label:"Leg Quarters",yield:.42,unitWeight:.59375,unit:"leg quarter",mode:"units",note:"USDA planning yield for bone-in, skin-on leg quarters; about 9.5 oz each."},
  thigh:{label:"Bone-In Thighs",yield:.52,unitWeight:.25,unit:"thigh",mode:"units",note:"USDA planning yield for bone-in, skin-on thighs; about 4 oz each."}
 }},
 fish:{name:"Fish",default:"filet",options:{filet:{label:"Fillets (perch/fish-fry style)",yield:.76,unitWeight:.33,unit:"filet",mode:"units",note:"Planning unit: about ⅓ lb per filet."}}},
 pork:{name:"Pulled Pork",default:"bone",options:{
  bone:{label:"Bone-in Boston Butt",yield:.60,unitWeight:8.5,unit:"bone-in butt",mode:"units"},
  boneless:{label:"Boneless Pork Shoulder",yield:.60,unitWeight:8,unit:"boneless shoulder",mode:"units"}
 }},
 hog:{name:"Whole Hog",default:"hog",options:{hog:{label:"Whole Hog",yield:"hog",unitWeight:null,unit:"whole hog",mode:"hog",note:"Feature protein only — not combined with other proteins."}}},
 brats:{name:"Polish / Brats",default:"links",options:{links:{label:"Links",yield:.90,unitWeight:.5,unit:"links",mode:"units"}}},
 brisket:{name:"Brisket",default:"packer",options:{
  packer:{label:"Whole Packer",yield:.50,unitWeight:14,unit:"packer",mode:"units"},
  flat:{label:"Brisket Flat",yield:.55,unitWeight:7,unit:"flat",mode:"units"}
 }},
 pmbe:{name:"Poor Man's Burnt Ends",default:"chuck",options:{
  chuck:{label:"Chuck Roast — Burnt Ends",yield:.60,unitWeight:4,unit:"chuck roast",mode:"units",note:"Planning yield set at 60% to account for chuck's normal cooked yield plus the additional cubing/caramelizing step."}
 }},
 prime:{name:"Prime Rib",default:"whole",options:{
  whole:{label:"Whole Roast",yield:.80,unitWeight:5,unit:"roast",mode:"units"},
  bone:{label:"Bone-in Standing Rib Roast",yield:.80,unitWeight:5,unit:"bone-in roast",mode:"units"}
 }},
 ribs:{name:"Ribs",default:"loin",options:{
  loin:{label:"Loin Back / Baby Back",yield:.70,unitWeight:2.25,unit:"rack",mode:"units"},
  spare:{label:"Spare / St. Louis",yield:.70,unitWeight:2.25,unit:"rack",mode:"units"}
 }}
};

/*
 * Current recommendation engine
 * --------------------------------
 * Recommendations are driven by the actual selected protein AND its
 * preparation.  This is intentionally separate from side quantity math.
 *
 * Section 4 (side picker) and Section 5 (shopping list) both call the
 * same sideRecommendation() function so there is one source of truth.
 */
function chickenPrep(id){
  return choices.chicken || meats.chicken.default;
}
function selectedProteinTags(){
  const tags=new Set();
  selected.forEach(k=>{
    if(k==="chicken"){
      const prep=chickenPrep();
      if(prep==="whole") tags.add("chicken_pulled");
      else if(prep==="legq") tags.add("chicken_quarters");
      else if(prep==="thigh") tags.add("chicken_thighs");
    }
    if(k==="fish") tags.add("fish");
    if(k==="pork") tags.add("pulled_pork");
    if(k==="brisket") tags.add("brisket");
    if(k==="pmbe") tags.add("pmbe");
    if(k==="brats") tags.add("brats");
    if(k==="ribs") tags.add("ribs");
    if(k==="prime") tags.add("prime_rib");
    if(k==="hog") tags.add("whole_hog");
  });
  return tags;
}
function hasAnyTag(tags){
  const active=selectedProteinTags();
  return tags.some(t=>active.has(t));
}
function sideRecommendation(id){
  /*
   * These are culinary pairing signals, not quantity rules.
   * A recommendation highlights a useful pairing; it never auto-selects
   * a side and never changes sideQty().
   */
  const active=selectedProteinTags();
  switch(id){
    case "mac":
      return active.size>0;
    case "cauli":
      return hasAnyTag(["chicken_pulled","chicken_quarters","chicken_thighs","fish"]);
    case "slaw":
      return hasAnyTag(["pulled_pork","brisket","pmbe","ribs","brats","chicken_pulled","chicken_quarters","chicken_thighs","fish"]);
    case "collards":
      return hasAnyTag(["pulled_pork","brisket","pmbe","ribs"]);
    case "broccoli":
      return hasAnyTag(["fish","chicken_pulled","chicken_quarters","chicken_thighs","pulled_pork","brisket","pmbe","ribs"]);
    case "cucumber":
      return hasAnyTag(["fish","chicken_pulled","chicken_quarters","chicken_thighs"]);
    case "kraut":
      return active.has("brats");
    case "beans":
      return false;
    case "corn":
      return hasAnyTag(["chicken_pulled","chicken_quarters","chicken_thighs","fish","pulled_pork","brisket","pmbe","ribs"]);
    case "cornbread":
      return active.size>0;
    case "rolls":
      /*
       * Rolls are a sandwich vehicle.  Chicken only qualifies when the
       * selected preparation is Whole Fryer — Pulled; quarters/thighs do not.
       */
      return hasAnyTag(["pulled_pork","chicken_pulled","brisket"]);
    default:
      return false;
  }
}

const sides={
 mac:{name:"Mac & Cheese",group:"main",unit:"tin",base:0.75,min:0.25,sensitivity:.45,round:.25,fill:"nearly full",note:"Anchor favorite; planned leftover is useful."},
 cauli:{name:"Cauliflower Mac & Cheese",group:"main",unit:"tin",base:0.75,min:0.25,sensitivity:.70,round:.25,fill:"nearly full",note:"Perennial favorite; historically less total demand than regular Mac."},
 slaw:{name:"Coleslaw",group:"main",unit:"recipe",base:2.50,min:0.5,sensitivity:.45,round:.5,fill:"recipe",note:"Anchor favorite; your 2024 double recipe ran out."},
 collards:{name:"Collard Greens",group:"main",unit:"recipe",base:1.25,min:0.5,sensitivity:.70,round:.25,fill:"recipe",note:"Popular, but leftovers are intentionally limited because they do not reheat well."},
 broccoli:{name:"Broccoli Salad",group:"main",unit:"recipe",base:1.0,min:0.5,sensitivity:.70,round:.25,fill:"recipe",note:"BBQ-style salad; one recipe has historically been about right."},
 cucumber:{name:"Cucumber Salad",group:"main",unit:"recipe",base:1.0,min:0.5,sensitivity:.70,round:.25,fill:"recipe",note:"One recipe has historically been about right."},
 kraut:{name:"Sauerkraut",group:"main",unit:"tin",base:0.50,min:0.25,sensitivity:.90,round:.25,fill:"thumb clearance",note:"Strongly paired with Polish Brats; keep leftovers tight because it does not reheat well."},
 beans:{name:"Baked Beans",group:"main",unit:"tin",base:0.50,min:0.25,sensitivity:.90,round:.25,fill:"thumb clearance",note:"Deliberately restrained; Meatfest history shows chronic overproduction."},
 corn:{name:"Corn on the Cob",group:"unit",unit:"ear",base:7,min:4,sensitivity:.60,round:2,fill:"half-ear portions",note:"Served as half ears. Historical target is deliberately modest."},
 cornbread:{name:"Cornbread",group:"accomp",unit:"piece",base:24,min:12,sensitivity:.20,round:6,fill:"mini cupcake",recipePieces:24,note:"BBQ accompaniment; traditional + gluten-free pieces can be mixed as needed."},
 rolls:{name:"Hawaiian Rolls",group:"accomp",unit:"piece",base:16,min:8,sensitivity:.10,round:8,fill:"piece",packagePieces:32,note:"Sandwich vehicle for pulled pork, pulled chicken and sliced brisket. Costco twin pack is 32 rolls."}
};
let selectedSides=new Set();
const sideOrder=["mac","cauli","slaw","collards","broccoli","cucumber","kraut","beans","corn","cornbread","rolls"];
function sideProteinFactor(n){return ({1:1.20,2:1.15,3:1.10,4:1.05,5:1.00,6:.95,7:.92,8:.90})[Math.max(1,Math.min(8,n))]||.90}
function sideVarietyFactor(n){return ({1:1.35,2:1.18,3:1.08,4:1.00,5:.97,6:.94,7:.92,8:.90})[Math.max(1,Math.min(8,n))]||.90}
function niceFraction(x){
  const whole=Math.floor(x+1e-8), frac=x-whole;
  let f="";
  if(Math.abs(frac-.25)<.03)f="¼"; else if(Math.abs(frac-.5)<.03)f="½"; else if(Math.abs(frac-.75)<.03)f="¾";
  return whole?(f?`${whole}${f}`:`${Math.round(x*10)/10}`):(f||`${Math.round(x*10)/10}`);
}
function roundUpTo(x,step){return Math.ceil((x-1e-9)/step)*step}
function roundNearest(x,step){return Math.round(x/step)*step}
function sideQty(id){
  const s=sides[id], [adults,kids]=activeTotals(), eaters=adults+kids*.5;
  if(!eaters)return 0;
  const pFactor=sideProteinFactor(selected.size);
  const nMain=Math.max(1,[...selectedSides].filter(x=>sides[x].group==="main").length);
  const vFactor=sideVarietyFactor(nMain);
  let q=s.base*(eaters/47)*pFactor*(1+(vFactor-1)*s.sensitivity);
  if(planningMode==="family") q*=1.125;
  if(id==="kraut"&&selected.has("brats"))q*=1.15;
  if(id==="corn"&&selected.size>=4)q*=.90;
  if(id==="rolls"){
    const sandwichProtein=(selected.has("pork")?1:0)+(selected.has("chicken")?1:0)+(selected.has("brisket")?1:0);
    q*=sandwichProtein?(0.65+0.12*Math.min(3,sandwichProtein)):.35;
  }
  if(id==="cornbread")q*=selected.size?(1.0+0.06*Math.min(4,selected.size)):0;
  /*
   * Low-headcount floor for recipe/tin sides:
   * These are practical batch/serving-pan units, not infinitely scalable
   * portions.  At small events, scaling them below their established
   * planning baseline produces unusably small amounts (e.g. ¼ tin of mac
   * or 1½ recipes of slaw for a 20-person Meatfest).  Piece/package
   * accompaniments continue to scale normally.
   */
  if(planningMode==="family") q=Math.max(s.min,q);
  else if(s.unit==="tin" || s.unit==="recipe") q=Math.max(s.base,q);
  else q=Math.max(s.min,q);
  if(s.unit==="tin")return roundNearest(q,s.round);
  if(s.unit==="recipe")return roundUpTo(q,s.round);
  if(s.unit==="ear")return Math.max(4,roundUpTo(q,2));
  return Math.max(s.min,roundUpTo(q,s.round));
}
function sideBuyText(id,q){
  const s=sides[id];
  if(s.unit==="tin"){
    if(q===.25)return "¼ tin"; if(q===.5)return "½ tin"; if(q===.75)return "¾ tin"; if(q===1)return "1 full tin";
    const full=Math.floor(q+1e-8), rem=Math.round((q-full)*4)/4, parts=[];
    if(full)parts.push(`${full} full tin${full>1?"s":""}`);
    if(rem===.25)parts.push("¼ tin"); if(rem===.5)parts.push("½ tin"); if(rem===.75)parts.push("¾ tin");
    return parts.join(" + ");
  }
  if(s.unit==="recipe")return `${niceFraction(q)} recipe${q===1?"":"s"}`;
  if(s.unit==="ear")return `${Math.round(q)} ear${q===1?"":"s"} (${Math.round(q*2)} half-ear pieces)`;
  if(s.unit==="piece"){
    if(id==="cornbread")return `${Math.round(q)} pieces • make ${Math.ceil(q/s.recipePieces)} recipe${Math.ceil(q/s.recipePieces)===1?"":"s"} (${s.recipePieces} pieces each)`;
    const pk=Math.ceil(q/s.packagePieces);return `${Math.round(q)} pieces • buy ${pk} package${pk===1?"":"s"} (${s.packagePieces} each)`;
  }
  return `${Math.round(q)} ${s.unit}`;
}
function sideDetails(id,q){const s=sides[id];return id==="rolls"?s.note:id==="corn"?s.note:`${s.note} Fill: ${s.fill}.`}
function renderSideCards(){
  const main=sideOrder.filter(id=>sides[id].group==="main"||sides[id].group==="unit"), accomp=sideOrder.filter(id=>sides[id].group==="accomp");
  const card=id=>{const s=sides[id],on=selectedSides.has(id),rec=sideRecommendation(id);return `<div class="sideCard ${on?"on":""} ${rec?"recommended":""}" data-side="${id}"><div class="sideTop"><div><b>${s.name}</b>${rec?'<span class="sideRec">RECOMMENDED</span>':''}</div><span class="sideCheck"></span></div><small>${s.unit==="tin"?"Practical serving-pan unit":s.unit==="recipe"?"Prepared from your recipe":s.unit==="ear"?"Whole ears → half-ear servings":s.unit==="piece"?"Plan pieces → buy packages":"Practical serving unit"}</small></div>`};
  $("mainSideCards").innerHTML=main.map(card).join("");$("accompSideCards").innerHTML=accomp.map(card).join("");
  document.querySelectorAll("[data-side]").forEach(el=>el.onclick=()=>{const id=el.dataset.side;if(selectedSides.has(id))selectedSides.delete(id);else selectedSides.add(id);renderSideCards();calcSides();save()});
}
function calcSides(){
  const box=$("sideResults"); if(!box)return;
  if(!selectedSides.size){box.innerHTML='<p class="note">Select any sides you want the calculator to plan. Recommended choices are highlighted above.</p>';return}
  const rows=[...selectedSides].sort((a,b)=>sideOrder.indexOf(a)-sideOrder.indexOf(b)).map(id=>({id,q:sideQty(id)}));
  box.innerHTML=rows.map(r=>{const s=sides[r.id];return `<div class="sideResult"><div class="resultTop"><div><div class="resultTitle">${s.name}</div><span class="pill">${s.unit==="tin"?"Tin":s.unit==="recipe"?"Recipe":s.unit==="ear"?"Ears":"Pieces"}</span>${sideRecommendation(r.id)?'<span class="pill">Recommended</span>':''}</div><div class="buy">${sideBuyText(r.id,r.q)}</div></div><div class="sideReason">${sideDetails(r.id,r.q)}</div></div>`}).join("");
}

const order=["chicken","fish","pork","hog","brats","brisket","pmbe","prime","ribs"];
let selected=new Set();let choices={};let guests=[];let mode="manual";let planningMode="meatfest";
order.forEach(k=>choices[k]=meats[k].default);
const $=id=>document.getElementById(id);
function localISODate(){
  const d=new Date();
  const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
function eventDetails(){
  const name=(document.getElementById("eventName")?.value||"Your Event").trim()||"Your Event";
  const date=document.getElementById("eventDate")?.value||localISODate();
  const d=new Date(date+"T12:00:00");
  const display=d.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});
  return {name,date,display};
}
function loadEventDetails(){
  try{
    const x=JSON.parse(localStorage.getItem("mfEvent16")||"{}");
    $("eventName").value=x.name||"Your Event";
    $("eventDate").value=x.date||localISODate();
  }catch(e){
    $("eventName").value="Your Event";
    $("eventDate").value=localISODate();
  }
  // V1.7.1: Standard is the explicit default for a fresh event.
  if(!localStorage.getItem("mf11")){
    $("serving").value=".333333";
  }
}
function saveEventDetails(){
  const e=eventDetails();
  localStorage.setItem("mfEvent16",JSON.stringify(e));
  return e;
}
function syncServingCards(){
  let value=Number($("serving").value);
  if(value>=.30&&value<.32){$("serving").value=".333333";value=.333333}
  document.querySelectorAll("[data-serving-choice]").forEach(b=>{
    b.classList.toggle("active",Math.abs(Number(b.dataset.servingChoice)-value)<0.000001);
  });
}

function save(){localStorage.setItem("mf11",JSON.stringify({adults:+$("adults").value||0,kids:+$("kids").value||0,serving:+$("serving").value,selected:[...selected],selectedSides:[...selectedSides],choices,guests,mode,planningMode}))}
function load(){try{let x=JSON.parse(localStorage.getItem("mf11"));if(!x)return;$("adults").value=x.adults??0;$("kids").value=x.kids??0;let s=Number(x.serving??.333333);$("serving").value=(s>=.30&&s<.32)||Math.abs(s-.333333)<.000001?".333333":String(s);selected=new Set(x.selected||[]);choices=Object.assign(choices,x.choices||{});guests=x.guests||[];mode=x.mode||"manual";planningMode=x.planningMode||"meatfest";selectedSides=new Set(x.selectedSides||[])}catch(e){}}
function setPlanningMode(next){
  planningMode=next==="family"?"family":"meatfest";
  if(planningMode==="family" && selected.has("hog")) selected.delete("hog");
  syncPlanningUI();
  renderMeats();
  renderSideCards();
  calc();
  save();
}
function syncPlanningUI(){
  const family=planningMode==="family";
  const sw=$("planningSwitch");
  if(sw)sw.classList.toggle("family",family);
  document.querySelectorAll("[data-plan-mode]").forEach(b=>b.classList.toggle("active",b.dataset.planMode===planningMode));
  const title=$("pageTitle"),sub=$("pageSub"),hint=$("modeHint"),note=$("planningNoteText");
  if(title)title.textContent=family?"How much should I buy?":"How much food?";
  if(sub)sub.textContent=family?"A practical family-BBQ model with butcher-friendly purchase sizes.":"Your Meatfest model, turned into a practical shopping list.";
  if(hint)hint.textContent=family?"Family model • small-batch buying":"Large-group model • default";
  if(note)note.innerHTML=family?"Family mode is designed for roughly 3–10 people (but is not limited to that range). It adds a 10–15% finished-meat cushion and uses practical small-batch purchase sizes; a specialty butcher may be needed for custom cuts.":"Meatfest mode uses the established large-group purchase units and historical planning model.";
  const n=$("planningNote"); if(n)n.classList.toggle("familyMode",family);
  const sn=$("sideModelNote"); if(sn)sn.textContent=family?"Family mode uses practical small-batch side quantities with a modest 10–15% cushion. Minimums stay useful for real recipes and small pans; you choose the sides.":"V2 plans for a Meatfest feast: enough to avoid running out, with modest useful leftovers. Recommendations are highlighted; you choose the sides.";
}
function renderMeats(){ const visibleOrder=planningMode==="family"?order.filter(k=>k!=="hog"):order; $("meats").innerHTML=visibleOrder.map(k=>{
  let m=meats[k],o=m.options[choices[k]],ids=Object.keys(m.options);
  if(planningMode==="family" && k==="brisket") ids=["flat"];
  if(planningMode==="family" && k==="brisket" && choices[k]!=="flat"){ choices[k]="flat"; o=m.options.flat; }
  let choiceControl=ids.length>1
    ? `<select data-choice="${k}">${Object.entries(m.options).map(([id,v])=>`<option value="${id}" ${id===choices[k]?"selected":""}>${v.label}</option>`).join("")}</select>`
    : `<div class="fixedChoice">${o.label}</div>`;
  return `<div class="meat ${selected.has(k)?"on":""}" data-k="${k}">
    <div class="top"><b>${m.name}</b><span class="check"></span></div>
    <small>${o.label}${k==="fish"?" • purchased as fillets":""}</small>
    <div class="choice" onclick="event.stopPropagation()">${choiceControl}</div>
  </div>`;
}).join("");
document.querySelectorAll(".meat").forEach(el=>el.onclick=()=>{
  let k=el.dataset.k;
  if(k==="hog"){
    if(selected.has("hog")) selected.delete("hog");
    else selected=new Set(["hog"]);
  }else{
    if(selected.has("hog")) selected.delete("hog");
    selected.has(k)?selected.delete(k):selected.add(k);
  }
  renderMeats();renderSideCards();calc();save()
});
document.querySelectorAll("[data-choice]").forEach(el=>el.onchange=()=>{
  choices[el.dataset.choice]=el.value;renderMeats();renderSideCards();calc();save()
});
}
function renderGuests(){ $("guestList").innerHTML=guests.map((g,i)=>`<div class="guest"><input data-i="${i}" data-f="name" value="${g.name||""}" placeholder="Last name"><input data-i="${i}" data-f="count" type="number" min="0" value="${g.count??""}" placeholder="-"><input data-i="${i}" data-f="a" type="number" min="0" value="${g.a??""}" placeholder="-"><input data-i="${i}" data-f="k" type="number" min="0" value="${g.k??""}" placeholder="-"><button class="btn smallbtn danger" data-del="${i}">×</button></div>`).join("");
document.querySelectorAll(".guest input").forEach(x=>x.oninput=()=>{let i=+x.dataset.i,f=x.dataset.f;guests[i][f]=f==="name"?x.value:(x.value===""?null:+x.value);calc();save()});
document.querySelectorAll("[data-del]").forEach(x=>x.onclick=()=>{guests.splice(+x.dataset.del,1);renderGuests();calc();save()});
}
function guestTotals(){let a=0,k=0;guests.forEach(g=>{let hasBreak=g.a!=null||g.k!=null;if(hasBreak){a+=+g.a||0;k+=+g.k||0}else{a+=+g.count||0}});return[a,k]}
function activeTotals(){if(mode==="guest"&&guests.length){return guestTotals()}return[+$("adults").value||0,+$("kids").value||0]}
function parseRows(text){let lines=text.trim().split(/\r?\n/).filter(Boolean);if(!lines.length)return[];let delim=lines[0].includes("\t")?"\t":",";let header=lines[0].toLowerCase().split(delim).map(x=>x.trim());let idx={name:header.findIndex(x=>/last|name/.test(x)),count:header.findIndex(x=>/count|total|guests|people/.test(x)),a:header.findIndex(x=>/^adult/.test(x)),k:header.findIndex(x=>/^kid|child/.test(x))};if(idx.name<0)idx.name=0;let out=[];for(let i=1;i<lines.length;i++){let p=lines[i].split(delim).map(x=>x.trim());if(!p.length)continue;let num=(j)=>j>=0&&p[j]!==""?parseFloat(p[j]):null;out.push({name:p[idx.name]||"",count:num(idx.count),a:num(idx.a),k:num(idx.k)})}return out}
function importText(text){let rows=parseRows(text);if(!rows.length){alert("I couldn't find any guest rows. Use columns like Last Name, Count, Adults, Kids.");return}guests=rows;mode="guest";$("manualTab").classList.remove("active");$("guestTab").classList.add("active");$("manualPane").classList.add("hidden");$("guestPane").classList.remove("hidden");renderGuests();calc();save()}

function purchaseDisplay(k,o,units,buyWeight){
  if(k==="fish"){
    return `BUY ${units} filet${units===1?"":"s"} (~${Math.ceil(buyWeight*100)/100} lb total)`;
  }
  if(k==="chicken"){
    if(o.unit==="leg quarter"||o.unit==="thigh"){
      return `BUY ${units} ${o.unit}${units===1?"":"s"} (~${Math.ceil(buyWeight*10)/10} lb total)`;
    }
    if(o.unit==="whole fryer"){
      return `BUY ${units} whole fryer${units===1?"":"s"} (~${Math.ceil(buyWeight*10)/10} lb total)`;
    }
  }
  if(k==="pmbe"){
    return `BUY ${units} chuck roast${units===1?"":"s"} (~${Math.ceil(buyWeight*10)/10} lb total)`;
  }
  return null;
}
function cutNote(k,o){
  if(o.note)return o.note;
  if(k==="brisket" && o.unit==="packer")return "Whole packers are commonly 14–18 lb. Excess is planned leftovers.";
  return "";
}

function wholeHogYield(hangingWeight){
  // Calibrated to the Meatfest 4.0 whole-hog results by translating the
  // original 50/75/100-attendee yield bands into hanging-weight anchors
  // under the standard 1/3-lb serving model: about 41.7 lb @ 40%,
  // 55.6 lb @ 45%, and 66.7 lb @ 50%. Yield then continues to improve
  // with carcass size, more slowly, to 55% @ 100 lb and 60% @ 150 lb+.
  // This is a Meatfest planning curve, not a universal hog-yield claim.
  const p=[[41.6667,.40],[55.5556,.45],[66.6667,.50],[100,.55],[150,.60]];
  if(hangingWeight<=p[0][0])return p[0][1];
  for(let i=1;i<p.length;i++){const [x2,y2]=p[i],[x1,y1]=p[i-1];if(hangingWeight<=x2)return y1+((hangingWeight-x1)/(x2-x1))*(y2-y1);}
  return .60;
}
function wholeHogPlan(finishedMeat){
  // Solve hangingWeight = finishedMeat / yield(hangingWeight).
  let w=Math.max(0.1,finishedMeat/.50);
  for(let i=0;i<40;i++){const next=finishedMeat/wholeHogYield(w);if(Math.abs(next-w)<0.0001){w=next;break}w=next;}
  return {hangingWeight:w,yield:wholeHogYield(w)};
}
function wholeHogWarning(hangingWeight){
  return hangingWeight>100?`<div class="purchaseNote hogWarning"><b>⚠️ Cooker capacity reminder:</b> target is about ${Math.ceil(hangingWeight)} lb hanging weight. A typical home hog cooker is generally around 100 lb capacity; verify your cooker before purchasing.</div>`:"";
}
function familyPurchase(k,o,bought){
  const up=x=>Math.ceil((x-1e-9)*2)/2;
  const lb=x=>Math.ceil((x-1e-9)*10)/10;
  if(k==="pork"){
    const w=Math.max(4,up(bought));
    return {units:1,buyWeight:w,buy:`ASK FOR ~${lb(w)} lb ${choices[k]==="boneless"?"boneless pork shoulder":"pork butt"}`,note:w<=5?"Specialty butcher recommended. A 4–5 lb butt is a practical family-BBQ size; grocery-store butts are often larger.":"Ask your butcher for a custom-size shoulder close to the calculated weight."};
  }
  if(k==="brisket"){
    const w=Math.max(4,up(bought));
    return {units:1,buyWeight:w,buy:`ASK FOR ~${lb(w)} lb brisket flat`,note:w<=6?"Specialty butcher recommended. A 4–6 lb flat is a practical small-BBQ size.":"Ask your butcher for a custom-size flat rather than a full packer."};
  }
  if(k==="ribs"){
    const halfRack=2.25/2;
    const halves=Math.max(1,Math.ceil((bought-1e-9)/halfRack));
    const racks=halves/2;
    const w=racks*2.25;
    let buy;
    if(halves===1) buy="BUY 1 half-rack";
    else if(halves===2) buy="BUY 1 rack (2 half-racks)";
    else buy=`BUY ${halves} half-racks (${niceFraction(racks)} full racks total)`;
    return {units:racks,buyWeight:w,buy,note:"Half-rack increments are supported for small gatherings; a specialty butcher can sell or cut the rack to size."};
  }
  if(k==="prime"){
    const w=Math.max(3,up(bought));
    return {units:1,buyWeight:w,buy:`ASK FOR ~${lb(w)} lb ${choices[k]==="bone"?"bone-in standing rib roast":"prime rib roast"}`,note:w<=4?"Specialty butcher recommended. A ~3 lb roast is a practical family-BBQ size.":"Ask your butcher for a custom-size roast close to the calculated weight."};
  }
  if(k==="brats"){
    const units=Math.max(1,Math.ceil(bought/.5));
    return {units,buyWeight:units*.5,buy:`BUY ${units} link${units===1?"":"s"}`,note:"Individual-link buying; no large package-size inflation."};
  }
  if(k==="fish"){
    const units=Math.max(1,Math.ceil(bought/.33));
    return {units,buyWeight:units*.33,buy:`BUY ${units} filet${units===1?"":"s"} (~${lb(units*.33)} lb total)`,note:"Individual fillets; purchase only what the family-sized event needs."};
  }
  if(k==="chicken"){
    if(o.unit==="whole fryer") { const units=Math.max(1,Math.ceil(bought/o.unitWeight)); return {units,buyWeight:units*o.unitWeight,buy:`BUY ${units} whole fryer${units===1?"":"s"} (~${lb(units*o.unitWeight)} lb total)`,note:units===1?"One whole fryer is the practical family purchase unit.":"Buy whole birds; the calculator avoids forcing a large packaged quantity."}; }
    const units=Math.max(1,Math.ceil(bought/o.unitWeight));
    return {units,buyWeight:units*o.unitWeight,buy:`BUY ${units} ${o.unit}${units===1?"":"s"}`,note:"Small-batch poultry purchase; specialty butcher can provide exact quantities."};
  }
  if(k==="pmbe"){
    const w=Math.max(3,up(bought));
    return {units:1,buyWeight:w,buy:`ASK FOR ~${lb(w)} lb chuck roast`,note:"Ask the butcher for a small chuck roast close to the calculated weight."};
  }
  return null;
}
$("file").onchange=e=>{let f=e.target.files[0];if(!f)return;let rd=new FileReader();rd.onload=()=>importText(rd.result);rd.readAsText(f)};
$("pasteBtn").onclick=()=>$("pasteArea").classList.toggle("hidden");
$("importPaste").onclick=()=>importText($("paste").value);
$("manualTab").onclick=()=>{mode="manual";$("manualTab").classList.add("active");$("guestTab").classList.remove("active");$("manualPane").classList.remove("hidden");$("guestPane").classList.add("hidden");calc();save()};
$("guestTab").onclick=()=>{mode="guest";$("guestTab").classList.add("active");$("manualTab").classList.remove("active");$("guestPane").classList.remove("hidden");$("manualPane").classList.add("hidden");calc();save()};
$("clearGuests").onclick=()=>{guests=[];mode="manual";renderGuests();calc();save()};
["adults","kids","serving"].forEach(id=>$(id).oninput=()=>{if(id!=="serving")mode="manual";calc();save()});

function populatePrint(){
  const s=buildSummary();
  const ev=eventDetails(); $("psTitle").textContent=ev.name.toUpperCase();
  $("psSub").textContent=`${ev.display}  |  ${s.rows.map(r=>r.m.name).join(" • ")}`;
  $("psAdults").textContent=s.adults;$("psKids").textContent=s.kids;$("psEaters").textContent=Math.round(s.eaters*10)/10;
  $("psProteins").innerHTML=s.rows.map(r=>`<span class="pill">${r.o.label}</span>`).join(" ");
  $("psSides").innerHTML=selectedSides.size?[...selectedSides].sort((a,b)=>sideOrder.indexOf(a)-sideOrder.indexOf(b)).map(id=>`<span class="pill">${sides[id].name}: ${sideBuyText(id,sideQty(id))}</span>`).join(" "):"<span class=\"ps-note\">None selected</span>";
  $("psBuyRows").innerHTML=s.rows.map(r=>`<div class="ps-row"><div><div class="ps-name">${r.m.name}</div><div class="ps-detail">${r.o.label} • ${Math.round(r.y*100)}% yield • ${Math.round(r.bought*10)/10} lb raw</div></div><div class="ps-buy">${r.buy.replace(/^BUY /,"")}</div></div>`).join("");
  $("psTotal").textContent=`${Math.ceil(s.total*10)/10} lb`;
  return s;
}
async function saveShare(){
  save(); const ev=saveEventDetails(); const s=populatePrint();
  const lines=[ev.name.toUpperCase(),`Event date: ${ev.display}`,`Planning mode: ${planningMode==="family"?"Family BBQ":"Meatfest"}`,`Guests: ${s.adults} adults + ${s.kids} kids (${Math.round(s.eaters*10)/10} adult-equivalent)`,"", "WHAT TO BUY"];
  s.rows.forEach(r=>lines.push(`${r.m.name} — ${r.buy.replace(/^BUY /,"")}`,`  ${r.o.label} | ${Math.round(r.y*100)}% yield | ${Math.round(r.bought*10)/10} lb raw`));
  if(selectedSides.size){lines.push("","SIDES");[...selectedSides].sort((a,b)=>sideOrder.indexOf(a)-sideOrder.indexOf(b)).forEach(id=>lines.push(`${sides[id].name} — ${sideBuyText(id,sideQty(id))}`));}
  lines.push("",`TOTAL RAW MEAT: ${Math.ceil(s.total*10)/10} lb`);
  const text=lines.join("\n");
  if(navigator.share){
    try{await navigator.share({title:"Meatfest Shopping List",text});return}catch(e){}
  }
  try{await navigator.clipboard.writeText(text);alert("Shopping list copied. Open Notes and paste it into a new note.")}catch(e){alert("Shopping list prepared. Use Print Pocket Sheet for a paper copy.")};
}
$("save").onclick=saveShare;
$("print").onclick=()=>{save();populatePrint();window.print()};
$("reset").onclick=()=>{if(confirm("Reset this Meatfest? This will clear the event name, reset the date to today, clear adults and kids, remove all protein and side selections, and clear the guest list.")){localStorage.clear();location.reload()}};


document.querySelectorAll("[data-plan-mode]").forEach(b=>b.onclick=()=>setPlanningMode(b.dataset.planMode));
syncPlanningUI();
loadEventDetails();
$("eventName").addEventListener("change",saveEventDetails);
$("eventDate").addEventListener("change",saveEventDetails);
document.querySelectorAll("[data-serving-choice]").forEach(b=>b.onclick=()=>{
  $("serving").value=b.dataset.servingChoice;
  syncServingCards();
  calc();
  save();
});

load();
syncPlanningUI();
if(!localStorage.getItem("mf11")) $("serving").value=".333333";
syncServingCards();
renderMeats();
renderSideCards();
renderGuests();if(mode==="guest"){ $("manualTab").classList.remove("active");$("guestTab").classList.add("active");$("manualPane").classList.add("hidden");$("guestPane").classList.remove("hidden") }calc();

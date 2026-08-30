/* FSDC Meatfest — UI state, presentation metadata, and side planning. */

const meats={
 chicken:{name:"Chicken / Poultry",default:"whole",options:{
  whole:{label:"Whole Fryer — Pulled",yield:.62,unitWeight:5,unit:"whole fryer",mode:"units",note:"Meatfest planning unit: 5 lb whole fryer."},
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

let sideRecommendation = function(id){
  const active=selectedProteinTags();
  const any=tags=>tags.some(t=>active.has(t));
  switch(id){
    case "mac": return active.size>0;
    case "cauli": return any(["chicken_pulled","chicken_quarters","chicken_thighs","fish"]);
    case "slaw": return any(["pulled_pork","brisket","pmbe","ribs","brats","chicken_pulled","chicken_quarters","chicken_thighs","fish"]);
    case "collards": return any(["pulled_pork","brisket","pmbe","ribs"]);
    case "broccoli": return any(["fish","chicken_pulled","chicken_quarters","chicken_thighs","pulled_pork","brisket","pmbe","ribs"]);
    case "cucumber": return any(["fish","chicken_pulled","chicken_quarters","chicken_thighs"]);
    case "kraut": return active.has("brats");
    case "beans": return false;
    case "corn": return any(["chicken_pulled","chicken_quarters","chicken_thighs","fish","pulled_pork","brisket","pmbe","ribs"]);
    case "cornbread": return active.size>0;
    case "rolls": return any(["pulled_pork","chicken_pulled","brisket"]);
    default: return false;
  }
};
function selectedProteinTags(){
  const tags=new Set();
  selected.forEach(k=>{
    if(k==="chicken"){
      const prep=choices.chicken||meats.chicken.default;
      if(prep==="whole")tags.add("chicken_pulled");
      else if(prep==="legq")tags.add("chicken_quarters");
      else if(prep==="thigh")tags.add("chicken_thighs");
    }
    if(k==="fish")tags.add("fish");
    if(k==="pork")tags.add("pulled_pork");
    if(k==="brisket")tags.add("brisket");
    if(k==="pmbe")tags.add("pmbe");
    if(k==="brats")tags.add("brats");
    if(k==="ribs")tags.add("ribs");
    if(k==="prime")tags.add("prime_rib");
    if(k==="hog")tags.add("whole_hog");
    if(k==="turkey")tags.add("chicken_pulled","chicken_quarters","chicken_thighs");
  });
  return tags;
}

const sides={
 mac:{name:"Mac & Cheese",group:"main",unit:"tin",base:.75,min:.25,sensitivity:.45,round:.25,fill:"nearly full",note:"Anchor favorite; planned leftover is useful."},
 cauli:{name:"Cauliflower Mac & Cheese",group:"main",unit:"tin",base:.75,min:.25,sensitivity:.70,round:.25,fill:"nearly full",note:"Perennial favorite; historically less total demand than regular Mac."},
 slaw:{name:"Coleslaw",group:"main",unit:"recipe",base:2.50,min:.5,sensitivity:.45,round:.5,fill:"recipe",note:"Anchor favorite; your 2024 double recipe ran out."},
 collards:{name:"Collard Greens",group:"main",unit:"recipe",base:1.25,min:.5,sensitivity:.70,round:.25,fill:"recipe",note:"Popular, but leftovers are intentionally limited because they do not reheat well."},
 broccoli:{name:"Broccoli Salad",group:"main",unit:"recipe",base:1,min:.5,sensitivity:.70,round:.25,fill:"recipe",note:"BBQ-style salad; one recipe has historically been about right."},
 cucumber:{name:"Cucumber Salad",group:"main",unit:"recipe",base:1,min:.5,sensitivity:.70,round:.25,fill:"recipe",note:"One recipe has historically been about right."},
 kraut:{name:"Sauerkraut",group:"main",unit:"tin",base:.50,min:.25,sensitivity:.90,round:.25,fill:"thumb clearance",note:"Strongly paired with Polish Brats; keep leftovers tight because it does not reheat well."},
 beans:{name:"Baked Beans",group:"main",unit:"tin",base:.50,min:.25,sensitivity:.90,round:.25,fill:"thumb clearance",note:"Deliberately restrained; Meatfest history shows chronic overproduction."},
 corn:{name:"Corn on the Cob",group:"unit",unit:"ear",base:7,min:4,sensitivity:.60,round:2,fill:"half-ear portions",note:"Served as half ears. Historical target is deliberately modest."},
 cornbread:{name:"Cornbread",group:"accomp",unit:"piece",base:24,min:12,sensitivity:.20,round:6,fill:"mini cupcake",recipePieces:24,note:"BBQ accompaniment; traditional + gluten-free pieces can be mixed as needed."},
 rolls:{name:"Hawaiian Rolls",group:"accomp",unit:"piece",base:16,min:8,sensitivity:.10,round:8,fill:"piece",packagePieces:32,note:"Sandwich vehicle for pulled pork, pulled chicken and sliced brisket. Costco twin pack is 32 rolls."}
};
let selectedSides=new Set();
const sideOrder=["mac","cauli","slaw","collards","broccoli","cucumber","kraut","beans","corn","cornbread","rolls"];
function sideProteinFactor(n){return ({1:1.20,2:1.15,3:1.10,4:1.05,5:1.00,6:.95,7:.92,8:.90})[Math.max(1,Math.min(8,n))]||.90}
function sideVarietyFactor(n){return ({1:1.35,2:1.18,3:1.08,4:1.00,5:.97,6:.94,7:.92,8:.90})[Math.max(1,Math.min(8,n))]||.90}
function niceFraction(x){
  const whole=Math.floor(x+1e-8),frac=x-whole;
  let f="";
  if(Math.abs(frac-.25)<.03)f="¼";else if(Math.abs(frac-.5)<.03)f="½";else if(Math.abs(frac-.75)<.03)f="¾";
  return whole?(f?`${whole}${f}`:`${Math.round(x*10)/10}`):(f||`${Math.round(x*10)/10}`);
}
function roundUpTo(x,step){return Math.ceil((x-1e-9)/step)*step}
function roundNearest(x,step){return Math.round(x/step)*step}
function sideQty(id){
  const s=sides[id],[adults,kids]=activeTotals(),eaters=adults+kids*.5;
  if(!eaters)return 0;
  const pFactor=sideProteinFactor(selected.size);
  const nMain=Math.max(1,[...selectedSides].filter(x=>sides[x].group==="main").length);
  const vFactor=sideVarietyFactor(nMain);
  let q=s.base*(eaters/47)*pFactor*(1+(vFactor-1)*s.sensitivity);
  if(planningMode==="family")q*=1.125;
  if(id==="kraut"&&selected.has("brats"))q*=1.15;
  if(id==="corn"&&selected.size>=4)q*=.90;
  if(id==="rolls"){
    const sandwichProtein=(selected.has("pork")?1:0)+(selected.has("chicken")?1:0)+(selected.has("brisket")?1:0);
    q*=sandwichProtein?(0.65+0.12*Math.min(3,sandwichProtein)):.35;
  }
  if(id==="cornbread")q*=selected.size?(1+.06*Math.min(4,selected.size)):0;
  if(planningMode==="family")q=Math.max(s.min,q);else if(s.unit==="tin"||s.unit==="recipe")q=Math.max(s.base,q);else q=Math.max(s.min,q);
  if(s.unit==="tin")return roundNearest(q,s.round);
  if(s.unit==="recipe")return roundUpTo(q,s.round);
  if(s.unit==="ear")return Math.max(4,roundUpTo(q,2));
  return Math.max(s.min,roundUpTo(q,s.round));
}
function sideBuyText(id,q){
  const s=sides[id];
  if(s.unit==="tin"){
    if(q===.25)return "¼ tin";if(q===.5)return "½ tin";if(q===.75)return "¾ tin";if(q===1)return "1 full tin";
    const full=Math.floor(q+1e-8),rem=Math.round((q-full)*4)/4,parts=[];
    if(full)parts.push(`${full} full tin${full>1?"s":""}`);
    if(rem===.25)parts.push("¼ tin");if(rem===.5)parts.push("½ tin");if(rem===.75)parts.push("¾ tin");
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
function sideDetails(id){const s=sides[id];return id==="rolls"||id==="corn"?s.note:`${s.note} Fill: ${s.fill}.`}
function renderSideCards(){
  const main=sideOrder.filter(id=>sides[id].group==="main"||sides[id].group==="unit"),accomp=sideOrder.filter(id=>sides[id].group==="accomp");
  const card=id=>{const s=sides[id],on=selectedSides.has(id),rec=sideRecommendation(id);return `<div class="sideCard ${on?"on":""} ${rec?"recommended":""}" data-side="${id}"><div class="sideTop"><div><b>${s.name}</b>${rec?'<span class="sideRec">RECOMMENDED</span>':''}</div><span class="sideCheck"></span></div><small>${s.unit==="tin"?"Practical serving-pan unit":s.unit==="recipe"?"Prepared from your recipe":s.unit==="ear"?"Whole ears → half-ear servings":s.unit==="piece"?"Plan pieces → buy packages":"Practical serving unit"}</small></div>`};
  $("mainSideCards").innerHTML=main.map(card).join("");$("accompSideCards").innerHTML=accomp.map(card).join("");
  document.querySelectorAll("[data-side]").forEach(el=>el.onclick=()=>{const id=el.dataset.side;if(selectedSides.has(id))selectedSides.delete(id);else selectedSides.add(id);renderSideCards();calcSides();save()});
}
function calcSides(){
  const box=$("sideResults");if(!box)return;
  if(!selectedSides.size){box.innerHTML='<p class="note">Select any sides you want the calculator to plan. Recommended choices are highlighted above.</p>';return}
  const rows=[...selectedSides].sort((a,b)=>sideOrder.indexOf(a)-sideOrder.indexOf(b)).map(id=>({id,q:sideQty(id)}));
  box.innerHTML=rows.map(r=>{const s=sides[r.id];return `<div class="sideResult"><div class="resultTop"><div><div class="resultTitle">${s.name}</div><span class="pill">${s.unit==="tin"?"Tin":s.unit==="recipe"?"Recipe":s.unit==="ear"?"Ears":"Pieces"}</span>${sideRecommendation(r.id)?'<span class="pill">Recommended</span>':''}</div><div class="buy">${sideBuyText(r.id,r.q)}</div></div><div class="sideReason">${sideDetails(r.id)}</div></div>`}).join("");
}

const order=["chicken","fish","pork","hog","brats","brisket","pmbe","prime","ribs"];
let selected=new Set();let choices={};let guests=[];let mode="manual";let planningMode="meatfest";
order.forEach(k=>choices[k]=meats[k].default);
const $=id=>document.getElementById(id);
function localISODate(){const d=new Date(),y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");return `${y}-${m}-${day}`}
function eventDetails(){const name=(document.getElementById("eventName")?.value||"Your Event").trim()||"Your Event";const date=document.getElementById("eventDate")?.value||localISODate();const d=new Date(date+"T12:00:00");const display=d.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});return {name,date,display}}
function loadEventDetails(){try{const x=JSON.parse(localStorage.getItem("mfEvent16")||"{}");$("eventName").value=x.name||"Your Event";$("eventDate").value=x.date||localISODate()}catch(e){$("eventName").value="Your Event";$("eventDate").value=localISODate()}if(!localStorage.getItem("mf11"))$("serving").value=".333333"}
function saveEventDetails(){const e=eventDetails();localStorage.setItem("mfEvent16",JSON.stringify(e));return e}
function syncServingCards(){let value=Number($("serving").value);if(value>=.30&&value<.32){$("serving").value=".333333";value=.333333}document.querySelectorAll("[data-serving-choice]").forEach(b=>b.classList.toggle("active",Math.abs(Number(b.dataset.servingChoice)-value)<.000001))}
function save(){localStorage.setItem("mf11",JSON.stringify({adults:+$("adults").value||0,kids:+$("kids").value||0,serving:+$("serving").value,selected:[...selected],selectedSides:[...selectedSides],choices,guests,mode,planningMode}))}
function load(){try{const x=JSON.parse(localStorage.getItem("mf11"));if(!x)return;$("adults").value=x.adults??0;$("kids").value=x.kids??0;let s=Number(x.serving??.333333);$("serving").value=(s>=.30&&s<.32)||Math.abs(s-.333333)<.000001?".333333":String(s);selected=new Set(x.selected||[]);choices=Object.assign(choices,x.choices||{});guests=x.guests||[];mode=x.mode||"manual";planningMode=x.planningMode||"meatfest";selectedSides=new Set(x.selectedSides||[])}catch(e){}}
function setPlanningMode(next){planningMode=next==="family"?"family":"meatfest";if(planningMode==="family")selected.delete("hog");syncPlanningUI();renderMeats();renderSideCards();calc();save()}
function syncPlanningUI(){const family=planningMode==="family",sw=$("planningSwitch");if(sw)sw.classList.toggle("family",family);document.querySelectorAll("[data-plan-mode]").forEach(b=>b.classList.toggle("active",b.dataset.planMode===planningMode));const title=$("pageTitle"),sub=$("pageSub"),hint=$("modeHint"),note=$("planningNoteText");if(title)title.textContent=family?"How much should I buy?":"How much food?";if(sub)sub.textContent=family?"A practical family-BBQ model with butcher-friendly purchase sizes.":"Your Meatfest model, turned into a practical shopping list.";if(hint)hint.textContent=family?"Family model • small-batch buying":"Large-group model • default";if(note)note.innerHTML=family?"Family mode adds a fixed 12.5% finished-meat cushion and uses practical small-batch purchase sizes; a specialty butcher may be needed for custom cuts.":"Meatfest mode uses the established large-group purchase units and historical planning model.";const n=$("planningNote");if(n)n.classList.toggle("familyMode",family);const sn=$("sideModelNote");if(sn)sn.textContent=family?"Family mode uses practical small-batch side quantities with a 12.5% meat cushion. Minimums stay useful for real recipes and small pans; you choose the sides.":"V2 plans for a Meatfest feast: enough to avoid running out, with modest useful leftovers. Recommendations are highlighted; you choose the sides."}
function renderMeats(){const visibleOrder=planningMode==="family"?order.filter(k=>k!=="hog"):order;$("meats").innerHTML=visibleOrder.map(k=>{const m=meats[k];let o=m.options[choices[k]],ids=Object.keys(m.options);if(planningMode==="family"&&k==="brisket"){ids=["flat"];if(choices[k]!=="flat"){choices[k]="flat";o=m.options.flat}}const choiceControl=ids.length>1?`<select data-choice="${k}">${Object.entries(m.options).filter(([id])=>ids.includes(id)).map(([id,v])=>`<option value="${id}" ${id===choices[k]?"selected":""}>${v.label}</option>`).join("")}</select>`:`<div class="fixedChoice">${o.label}</div>`;return `<div class="meat ${selected.has(k)?"on":""}" data-k="${k}"><div class="top"><b>${m.name}</b><span class="check"></span></div><small>${o.label}${k==="fish"?" • purchased as fillets":""}</small><div class="choice" onclick="event.stopPropagation()">${choiceControl}</div></div>`}).join("");document.querySelectorAll(".meat").forEach(el=>el.onclick=()=>{const k=el.dataset.k;if(k==="hog"){if(selected.has("hog"))selected.delete("hog");else selected=new Set(["hog"])}else{if(selected.has("hog"))selected.delete("hog");selected.has(k)?selected.delete(k):selected.add(k)}renderMeats();renderSideCards();calc();save()});document.querySelectorAll("[data-choice]").forEach(el=>el.onchange=()=>{choices[el.dataset.choice]=el.value;renderMeats();renderSideCards();calc();save()})}
function renderGuests(){$("guestList").innerHTML=guests.map((g,i)=>`<div class="guest"><input data-i="${i}" data-f="name" value="${g.name||""}" placeholder="Last name"><input data-i="${i}" data-f="count" type="number" min="0" value="${g.count??""}" placeholder="-"><input data-i="${i}" data-f="a" type="number" min="0" value="${g.a??""}" placeholder="-"><input data-i="${i}" data-f="k" type="number" min="0" value="${g.k??""}" placeholder="-"><button class="btn smallbtn danger" data-del="${i}">×</button></div>`).join("");document.querySelectorAll(".guest input").forEach(x=>x.oninput=()=>{const i=+x.dataset.i,f=x.dataset.f;guests[i][f]=f==="name"?x.value:(x.value===""?null:+x.value);calc();save()});document.querySelectorAll("[data-del]").forEach(x=>x.onclick=()=>{guests.splice(+x.dataset.del,1);renderGuests();calc();save()})}
function guestTotals(){let a=0,k=0;guests.forEach(g=>{const hasBreak=g.a!=null||g.k!=null;if(hasBreak){a+=+g.a||0;k+=+g.k||0}else a+=+g.count||0});return[a,k]}
function activeTotals(){return mode==="guest"&&guests.length?guestTotals():[+$("adults").value||0,+$("kids").value||0]}
function parseRows(text){const lines=text.trim().split(/\r?\n/).filter(Boolean);if(!lines.length)return[];const delim=lines[0].includes("\t")?"\t":",";const header=lines[0].toLowerCase().split(delim).map(x=>x.trim());const idx={name:header.findIndex(x=>/last|name/.test(x)),count:header.findIndex(x=>/count|total|guests|people/.test(x)),a:header.findIndex(x=>/^adult/.test(x)),k:header.findIndex(x=>/^kid|child/.test(x))};if(idx.name<0)idx.name=0;const out=[];for(let i=1;i<lines.length;i++){const p=lines[i].split(delim).map(x=>x.trim());if(!p.length)continue;const num=j=>j>=0&&p[j]!==""?parseFloat(p[j]):null;out.push({name:p[idx.name]||"",count:num(idx.count),a:num(idx.a),k:num(idx.k)})}return out}
function importText(text){const rows=parseRows(text);if(!rows.length){alert("I couldn't find any guest rows. Use columns like Last Name, Count, Adults, Kids.");return}guests=rows;mode="guest";$("manualTab").classList.remove("active");$("guestTab").classList.add("active");$("manualPane").classList.add("hidden");$("guestPane").classList.remove("hidden");renderGuests();calc();save()}
$("file").onchange=e=>{const f=e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>importText(rd.result);rd.readAsText(f)};
$("pasteBtn").onclick=()=>$("pasteArea").classList.toggle("hidden");
$("importPaste").onclick=()=>importText($("paste").value);
$("manualTab").onclick=()=>{mode="manual";$("manualTab").classList.add("active");$("guestTab").classList.remove("active");$("manualPane").classList.remove("hidden");$("guestPane").classList.add("hidden");calc();save()};
$("guestTab").onclick=()=>{mode="guest";$("guestTab").classList.add("active");$("manualTab").classList.remove("active");$("guestPane").classList.remove("hidden");$("manualPane").classList.add("hidden");calc();save()};
$("clearGuests").onclick=()=>{guests=[];mode="manual";renderGuests();calc();save()};
["adults","kids","serving"].forEach(id=>$(id).oninput=()=>{if(id!=="serving")mode="manual";calc();save()});
function populatePrint(){const s=buildSummary(),ev=eventDetails();$("psTitle").textContent=ev.name.toUpperCase();$("psSub").textContent=`${ev.display}  |  ${s.rows.map(r=>r.m.name).join(" • ")}`;$("psAdults").textContent=s.adults;$("psKids").textContent=s.kids;$("psEaters").textContent=Math.round(s.eaters*10)/10;$("psProteins").innerHTML=s.rows.map(r=>`<span class="pill">${r.option.label}</span>`).join(" ");$("psSides").innerHTML=selectedSides.size?[...selectedSides].sort((a,b)=>sideOrder.indexOf(a)-sideOrder.indexOf(b)).map(id=>`<div class="ps-sideRow"><div class="ps-sideName">${sides[id].name}</div><div class="ps-sideBuy">${sideBuyText(id,sideQty(id))}</div></div>`).join(""):"<div class=\"ps-note\">None selected</div>";$("psBuyRows").innerHTML=s.rows.map(r=>`<div class="ps-row"><div><div class="ps-name">${r.m.name}</div><div class="ps-detail">${r.option.label} • ${Math.round((r.key==="hog"?r.row.finished/r.row.raw:(typeof r.option.yield==="number"?r.option.yield:1))*100)}% yield • ${Math.round(r.row.raw*10)/10} lb raw</div></div><div class="ps-buy">${r.buy.replace(/^BUY /,"")}</div></div>`).join("");$("psTotal").textContent=`${Math.ceil(s.total*10)/10} lb`;return s}
async function saveShare(){save();const ev=saveEventDetails(),s=populatePrint();const lines=[ev.name.toUpperCase(),`Event date: ${ev.display}`,`Planning mode: ${planningMode==="family"?"Family BBQ":"Meatfest"}`,`Guests: ${s.adults} adults + ${s.kids} kids (${Math.round(s.eaters*10)/10} adult-equivalent)`,"","WHAT TO BUY"];s.rows.forEach(r=>lines.push(`${r.m.name} — ${r.buy.replace(/^BUY /,"")}`,`  ${r.option.label} | ${Math.round((r.key==="hog"?r.row.finished/r.row.raw:(typeof r.option.yield==="number"?r.option.yield:1))*100)}% yield | ${Math.round(r.row.raw*10)/10} lb raw`));if(selectedSides.size){lines.push("","SIDES");[...selectedSides].sort((a,b)=>sideOrder.indexOf(a)-sideOrder.indexOf(b)).forEach(id=>lines.push(`${sides[id].name} — ${sideBuyText(id,sideQty(id))}`))}lines.push("",`TOTAL RAW MEAT: ${Math.ceil(s.total*10)/10} lb`);const text=lines.join("\n");if(navigator.share){try{await navigator.share({title:"Meatfest Shopping List",text});return}catch(e){}}try{await navigator.clipboard.writeText(text);alert("Shopping list copied. Open Notes and paste it into a new note.")}catch(e){alert("Shopping list prepared. Use Print Pocket Sheet for a paper copy.")}}
$("save").onclick=saveShare;
$("print").onclick=()=>{save();populatePrint();window.print()};
$("reset").onclick=()=>{if(confirm("Reset this Meatfest? This will clear the event name, reset the date to today, clear adults and kids, remove all protein and side selections, and clear the guest list.")){localStorage.clear();location.reload()}};
document.querySelectorAll("[data-plan-mode]").forEach(b=>b.onclick=()=>setPlanningMode(b.dataset.planMode));
syncPlanningUI();loadEventDetails();$("eventName").addEventListener("change",saveEventDetails);$("eventDate").addEventListener("change",saveEventDetails);document.querySelectorAll("[data-serving-choice]").forEach(b=>b.onclick=()=>{$("serving").value=b.dataset.servingChoice;syncServingCards();calc();save()});load();syncPlanningUI();if(!localStorage.getItem("mf11"))$("serving").value=".333333";syncServingCards();renderMeats();renderSideCards();renderGuests();if(mode==="guest"){$("manualTab").classList.remove("active");$("guestTab").classList.add("active");$("manualPane").classList.add("hidden");$("guestPane").classList.remove("hidden")}
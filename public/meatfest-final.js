/* FSDC Meatfest — browser presentation layer for the shared MeatEngine. */
(() => {
  const printStyle = document.createElement("style");
  printStyle.media = "print";
  printStyle.textContent = `
@page{size:letter landscape;margin:0}
html,body{background:#fff!important;color:#000!important}
body{padding:0!important;margin:0!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body>*{display:none!important}
#printSheet{display:block!important;width:11in;height:8.5in;margin:0;padding:.22in;position:relative;border:1px solid #000;background:#fff;color:#000;font-family:Arial,sans-serif;overflow:hidden}
#printSheet .ps-title{font-size:22px;font-weight:900;margin:0 0 3px;color:#000}
#printSheet .ps-sub{font-size:10px;color:#000;margin-bottom:8px}
#printSheet .ps-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px;align-items:start}
#printSheet .ps-grid>div{display:contents}
#printSheet .ps-box{border:1px solid #000;border-radius:0;padding:7px;margin:0 0 7px;break-inside:avoid}
#printSheet h3{font-size:10px;letter-spacing:.08em;margin:0 0 5px;color:#000}
#printSheet .ps-headcount{display:flex;gap:14px;font-size:9px;color:#000}
#printSheet .ps-big{font-size:16px;font-weight:900;color:#000}
#printSheet .ps-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:7px;border-bottom:1px solid #000;padding:5px 0;break-inside:avoid}
#printSheet .ps-row:last-child{border-bottom:0}
#printSheet .ps-name{font-size:9px;font-weight:800;color:#000}
#printSheet .ps-buy{font-size:9px;font-weight:900;text-align:right;color:#000;max-width:2.05in}
#printSheet .ps-detail{font-size:7.5px;color:#000;margin-top:1px}
#printSheet .ps-note{font-size:8px;color:#000;line-height:1.2}
#printSheet .pill{display:inline-block;border:1px solid #000;border-radius:0;padding:2px 4px;font-size:7.5px;color:#000;margin:1px 3px 1px 0}
#printSheet .ps-side-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;border-bottom:1px solid #000;padding:5px 0;font-size:9px;line-height:1.15}
#printSheet .ps-side-row:last-child{border-bottom:0}
#printSheet .ps-side-name{font-weight:800}
#printSheet .ps-side-amount{font-weight:900;text-align:right;max-width:2.15in}
#printSheet .ps-sides-note{font-size:7.5px;color:#000;margin-top:5px;line-height:1.2}
#printSheet .ps-grid>div:nth-child(1) .ps-box:nth-child(1){grid-column:1;grid-row:1}
#printSheet .ps-grid>div:nth-child(1) .ps-box:nth-child(2){grid-column:1;grid-row:2}
#printSheet .ps-grid>div:nth-child(2) .ps-box:nth-child(1){grid-column:1;grid-row:3}
#printSheet .ps-grid>div:nth-child(2) .ps-box:nth-child(2){grid-column:1;grid-row:4}
#printSheet .ps-grid>div:nth-child(1) .ps-box:nth-child(3){grid-column:2;grid-row:1 / span 4}
#printSheet .fold{position:absolute;top:.16in;bottom:.16in;left:50%;border-left:1px dashed #000}
#printSheet .foldlabel{position:absolute;left:calc(50% - 10px);top:50%;font-size:7px;color:#000;background:#fff;padding:2px 3px;transform:translateY(-50%)}
#printSheet .ps-footer{position:absolute;bottom:4px;left:.22in;right:.22in;display:flex;justify-content:space-between;font-size:7px;color:#000}
  `;
  document.head.appendChild(printStyle);

  Object.assign(sides, {
    greenbeans:{name:"Green Beans",group:"main",unit:"recipe",base:1,min:.5,sensitivity:.70,round:.25,fill:"recipe",note:"Grilled or smoked BBQ vegetable side."},
    potatosalad:{name:"Potato Salad",group:"main",unit:"recipe",base:1.5,min:.5,sensitivity:.55,round:.5,fill:"recipe",note:"Classic BBQ side."},
    asparagus:{name:"Asparagus",group:"main",unit:"recipe",base:1,min:.5,sensitivity:.70,round:.25,fill:"recipe",note:"Grilled or smoked BBQ vegetable side."},
    pastasalad:{name:"Pasta Salad",group:"main",unit:"recipe",base:1.5,min:.5,sensitivity:.55,round:.5,fill:"recipe",note:"Classic cold BBQ side; practical make-ahead option."}
  });
  sideOrder.splice(0,sideOrder.length,"asparagus","beans","broccoli","cauli","collards","corn","cucumber","greenbeans","kraut","mac","pastasalad","potatosalad","slaw","cornbread","rolls");

  meats.turkey={name:"Turkey",default:"whole",options:{
    whole:{label:"Whole Turkey",yield:.55,unitWeight:14,unit:"whole turkey",mode:"units"},
    breast:{label:"Turkey Breast",yield:.65,unitWeight:7,unit:"turkey breast",mode:"units"},
    legs:{label:"Turkey Legs",yield:.45,unitWeight:.75,unit:"turkey leg",mode:"units"}
  }};
  if(!order.includes("turkey"))order.push("turkey");
  if(!choices.turkey)choices.turkey=meats.turkey.default;

  function proteinTagsForRecommendations(){
    const tags=new Set();
    selected.forEach(key=>{
      if(key==="chicken"){
        const prep=choices.chicken||meats.chicken.default;
        if(prep==="whole")tags.add("chicken_pulled");else if(prep==="legq")tags.add("chicken_quarters");else if(prep==="thigh")tags.add("chicken_thighs");
      }else if(key==="turkey"){tags.add("chicken_pulled");tags.add("chicken_quarters");tags.add("chicken_thighs");}
      else if(key==="fish")tags.add("fish");else if(key==="pork")tags.add("pulled_pork");else if(key==="brisket")tags.add("brisket");else if(key==="pmbe")tags.add("pmbe");else if(key==="brats")tags.add("brats");else if(key==="ribs")tags.add("ribs");else if(key==="prime")tags.add("prime_rib");else if(key==="hog")tags.add("whole_hog");
    });return tags;
  }
  sideRecommendation = function(id){
    const active=proteinTagsForRecommendations(),any=tags=>tags.some(tag=>active.has(tag));
    switch(id){
      case "mac":return active.size>0;case "cauli":return any(["chicken_pulled","chicken_quarters","chicken_thighs","fish"]);case "slaw":return any(["pulled_pork","brisket","pmbe","ribs","brats","chicken_pulled","chicken_quarters","chicken_thighs","fish"]);case "collards":return any(["pulled_pork","brisket","pmbe","ribs"]);case "broccoli":return any(["fish","chicken_pulled","chicken_quarters","chicken_thighs","pulled_pork","brisket","pmbe","ribs"]);case "cucumber":return any(["fish","chicken_pulled","chicken_quarters","chicken_thighs"]);case "kraut":return active.has("brats");case "beans":return false;case "corn":return any(["chicken_pulled","chicken_quarters","chicken_thighs","fish","pulled_pork","brisket","pmbe","ribs"]);case "cornbread":return active.size>0;case "rolls":return any(["pulled_pork","chicken_pulled","brisket"]);case "greenbeans":return active.has("prime_rib");case "asparagus":return active.has("prime_rib");case "potatosalad":return active.size>0;case "pastasalad":return active.size>0;default:return false;
    }
  };

  meats.hog.options = {
    headfeet:{label:"Head & Feet On",yield:"hog",unitWeight:null,unit:"whole hog",mode:"hog",headFeet:"on",note:"Original Meatfest whole-hog model: hanging weight with head + feet on."},
    headoff:{label:"Head & Feet Off",yield:"hog",unitWeight:null,unit:"whole hog",mode:"hog",headFeet:"off",note:"Hanging-weight target adjusted 7% lower for head + feet removed."}
  };
  if(!meats.hog.options[choices.hog])choices.hog="headfeet";

  function activeEaters(){const [adults,kids]=activeTotals();return{adults,kids,eaters:adults+kids*.5};}
  function portion(){return Number($("serving").value)||MeatEngine.STANDARD_SERVING;}

  function rowFor(key,eaters){
    const m=meats[key],choiceId=choices[key]||m.default,option=m.options[choiceId];
    const engine = planningMode === "family" ? MeatEngine.familyRow : MeatEngine.canonicalRow;
    const row=engine({key,eaters,serving:portion(),choice:{id:choiceId,unit:option?.unit,headFeet:option?.headFeet}});if(!row)return null;
    let buy,note=option?.note||"";const family=planningMode==="family";
    if(key==="hog"){
      const prep=option.headFeet==="off"?"head & feet off":"head & feet on";buy=`TARGET ~${Math.ceil(row.buyWeight)} lb hanging weight (${prep})`;
      note=option.headFeet==="off"?"Whole-hog target uses the validated Meatfest hanging-weight curve with a 7% adjustment for head + feet removed. No live-weight conversion is used.":"Whole-hog target uses the validated Meatfest hanging-weight curve. No live-weight conversion is used. This preserves the original head + feet-on model.";
    }else if(key==="ribs"){
      if(family&&row.units<1)buy="BUY 1 half-rack";else if(family&&row.units%1!==0)buy=`BUY ${row.units*2} half-racks (${row.units} full racks total)`;else buy=`BUY ${row.units} rack${row.units===1?"":"s"} (~${MeatEngine.round1(row.buyWeight)} lb total)`;
      note=family?"Family mode supports half-rack increments and applies a modest meat cushion before purchase rounding.":`Count-based planning: ${MeatEngine.round1(eaters*MeatEngine.ANCHORS.ribsTakeRate*(portion()/MeatEngine.STANDARD_SERVING))} takers × ${MeatEngine.ANCHORS.ribsPerTaker} ribs ÷ ${MeatEngine.ANCHORS.ribsPerRack} ribs/rack.`;
    }else if(key==="brats"){
      buy=`BUY ${row.units} half-lb link${row.units===1?"":"s"} (~${MeatEngine.round1(row.buyWeight)} lb total)`;note=family?"Family mode uses individual half-pound links after applying the family meat cushion.":"Established Meatfest sausage planning unit: about one ½-lb link per six adult-equivalent eaters.";
    }else if(key==="brisket"){
      if(family){buy=`ASK FOR ~${MeatEngine.round1(row.buyWeight)} lb brisket flat`;note="Family mode uses a small brisket-flat purchase rather than forcing a whole packer.";}
      else if(choiceId==="packer"){const askLb=Math.max(14,Math.round(row.buyWeight));buy=`BUY 1 whole packer (~${MeatEngine.round1(row.buyWeight)} lb; ask for a packer around ${askLb} lb)`;note="Meatfest anchor: one practical whole packer sized to the calculated requirement; do not split the requirement into multiple small packers.";}
      else{buy=`BUY ${row.units} brisket flat${row.units===1?"":"s"} (~${MeatEngine.round1(row.buyWeight)} lb total)`;note="Brisket-flat planning uses the established 55% cooked-yield assumption and 7-lb purchase unit.";}
    }else if(key==="pmbe"){
      buy=family?`ASK FOR ~${MeatEngine.round1(row.buyWeight)} lb chuck roast`:`BUY ${row.units} chuck roast${row.units===1?"":"s"} (~${MeatEngine.round1(row.buyWeight)} lb total)`;note=family?"Family mode uses a small chuck roast and applies the family meat cushion before purchase rounding.":"Meatfest PMBE anchor: four 4-lb chuck roasts at 48 adult-equivalent eaters.";
    }else if(key==="pork"){
      buy=family?`ASK FOR ~${MeatEngine.round1(row.buyWeight)} lb ${choiceId==="boneless"?"boneless pork shoulder":"pork butt"}`:`BUY ${row.units} ${choiceId==="boneless"?"boneless pork shoulder":"bone-in butt"}${row.units===1?"":"s"} (~${MeatEngine.round1(row.buyWeight)} lb total)`;
      note=family?"Family mode uses a butcher-friendly small shoulder after applying the family meat cushion.":choiceId==="boneless"?"Boneless pork shoulder uses the established 60% cooked-yield assumption and 8-lb purchase unit.":"Meatfest pulled-pork anchor: two 8.5-lb bone-in butts at 48 adult-equivalent eaters.";
    }else if(key==="chicken"){
      buy=`BUY ${row.units} ${option.unit}${row.units===1?"":"s"} (~${MeatEngine.round1(row.buyWeight)} lb total)`;note=family?"Family mode uses the selected poultry purchase unit after applying the family meat cushion.":choiceId==="whole"?"Meatfest whole-chicken anchor: four 5-lb fryers at 48 adult-equivalent eaters.":"Poultry planning uses the selected cut's established cooked-yield and purchase unit.";
    }else if(key==="fish"){
      buy=`BUY ${row.units} filet${row.units===1?"":"s"} (~${MeatEngine.round1(row.buyWeight)} lb total)`;note=family?"Family mode uses individual fillets after applying the family meat cushion.":"Fish planning uses individual fillets at about ⅓ lb each and a 76% planning yield.";
    }else if(key==="prime"){
      buy=family?`ASK FOR ~${MeatEngine.round1(row.buyWeight)} lb ${choiceId==="bone"?"bone-in standing rib roast":"prime rib roast"}`:`BUY ${row.units} ${choiceId==="bone"?"bone-in roast":"roast"}${row.units===1?"":"s"} (~${MeatEngine.round1(row.buyWeight)} lb total)`;note=family?"Family mode uses a butcher-friendly small roast after applying the family meat cushion.":"Prime rib planning uses an 80% cooked-yield assumption and a 5-lb roast purchase unit.";
    }else if(key==="turkey"){
      buy=`BUY ${row.units} ${option.unit}${row.units===1?"":"s"} (~${MeatEngine.round1(row.buyWeight)} lb total)`;note="Turkey uses a dedicated yield and purchase-unit model; side recommendations follow the chicken/poultry pairing set.";
    }
    return{key,m,option,row,buy,note};
  }

  window.calc=function(){
    const t=activeEaters();const rows=[...selected].map(key=>rowFor(key,t.eaters)).filter(Boolean);const total=rows.reduce((sum,item)=>sum+item.row.buyWeight,0);
    $("statAdults").textContent=t.adults;$("statKids").textContent=t.kids;$("statEaters").textContent=MeatEngine.round1(t.eaters);$("totalRaw").textContent=total?`${MeatEngine.round1(total)} lb`:"0 lb";
    $("summary").textContent=rows.length?`${rows.length} protein${rows.length>1?"s":""} • ${MeatEngine.round1(t.eaters)} adult-equivalent eaters${planningMode==="family"?" • 12.5% family cushion":""}`:"Select at least one protein.";
    const resultsBox = $("results");
    resultsBox.innerHTML = rows.length ? rows.map(({key,m,option,row,buy,note})=>{const excess=row.excess>.5?` • Planned excess: <span class="excess">${MeatEngine.round1(row.excess)} lb</span>`:"";const unit=key==="hog"?" • Purchase basis: hanging weight":(key!=="ribs"&&key!=="brats"&&option.mode==="units")?` • Planning unit: ${option.unitWeight} lb`:"";const yieldRate=key==="hog"?row.finished/row.raw:(typeof option.yield==="number"?option.yield:1);return `<div class="result"><div class="resultTop"><div><div class="resultTitle">${m.name}</div><span class="pill">${option.label}</span><span class="pill">${Math.round(yieldRate*100)}% yield</span></div><div class="buy">${buy||""}</div></div><div class="details">Finished meat needed: <b>${MeatEngine.round1(row.finished)} lb</b> • Raw/hanging requirement: <b>${MeatEngine.round1(row.raw)} lb</b>${unit}${planningMode==="family"?" • Family purchase model":""}${excess}</div>${note?`<div class="purchaseNote">${note}</div>`:""}</div>`}).join("") : "<p class='note'>Select at least one protein.</p>";
    calcSides();
  };

  window.buildSummary=function(){const t=activeEaters();const rows=[...selected].map(key=>rowFor(key,t.eaters)).filter(Boolean);return{adults:t.adults,kids:t.kids,eaters:t.eaters,rows,total:rows.reduce((s,r)=>s+r.row.buyWeight,0)}};

  window.populatePrint=function(){
    const s=window.buildSummary(),ev=eventDetails();
    $("psTitle").textContent=ev.name.toUpperCase();$("psSub").textContent=`${ev.display}  |  ${s.rows.map(r=>r.m.name).join(" • ")}`;
    $("psAdults").textContent=s.adults;$("psKids").textContent=s.kids;$("psEaters").textContent=Math.round(s.eaters*10)/10;
    $("psProteins").innerHTML=s.rows.map(r=>`<span class="pill">${r.option.label}</span>`).join(" ");
    $("psSides").innerHTML=selectedSides.size?[...selectedSides].sort((a,b)=>sideOrder.indexOf(a)-sideOrder.indexOf(b)).map(id=>`<div class="ps-side-row"><span class="ps-side-name">${sides[id].name}</span><span class="ps-side-amount">${sideBuyText(id,sideQty(id))}</span></div>`).join(""):`<div class="ps-sides-note">No sides selected.</div>`;
    $("psBuyRows").innerHTML=s.rows.map(r=>`<div class="ps-row"><div><div class="ps-name">${r.m.name}</div><div class="ps-detail">${r.option.label} • ${Math.round((r.key==="hog"?r.row.finished/r.row.raw:(typeof r.option.yield==="number"?r.option.yield:1))*100)}% yield • ${Math.round(r.row.raw*10)/10} lb raw</div></div><div class="ps-buy">${r.buy.replace(/^BUY /,"")}</div></div>`).join("");
    $("psTotal").textContent=`${Math.ceil(s.total*10)/10} lb`;return s;
  };

  renderMeats();renderSideCards();window.calc();
})();

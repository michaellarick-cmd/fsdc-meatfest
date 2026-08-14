/* Meatfest recommendation audit — culinary pairings only; no quantity math. */
(function(){
  function tags(){
    const t=new Set();
    (selected||[]).forEach(k=>{
      if(k==="chicken"){const p=choices.chicken||"whole";t.add(p==="whole"?"chicken_pulled":p==="legq"?"chicken_quarters":"chicken_thighs");}
      else if(k==="fish")t.add("fish"); else if(k==="pork")t.add("pulled_pork"); else if(k==="brisket")t.add("brisket"); else if(k==="pmbe")t.add("pmbe"); else if(k==="brats")t.add("brats"); else if(k==="ribs")t.add("ribs"); else if(k==="prime")t.add("prime_rib"); else if(k==="hog")t.add("whole_hog"); else if(k==="turkey")t.add("turkey"); else if(k==="porkbelly")t.add("pork_belly");
    }); return t;
  }
  function any(t,a){return a.some(x=>t.has(x));}
  function recommended(id){
    const t=tags();
    switch(id){
      case "mac": return any(t,["pulled_pork","brisket","pmbe","ribs","pork_belly","chicken_pulled","chicken_quarters","chicken_thighs","turkey","whole_hog"]);
      case "cauli": return any(t,["chicken_pulled","chicken_quarters","chicken_thighs","fish"]);
      case "slaw": return any(t,["pulled_pork","brisket","pmbe","ribs","brats","pork_belly","chicken_pulled","chicken_quarters","chicken_thighs","turkey","fish","whole_hog"]);
      case "collards": return any(t,["pulled_pork","brisket","pmbe","ribs","pork_belly","fish","whole_hog"]);
      case "broccoli": return any(t,["fish","chicken_pulled","chicken_quarters","chicken_thighs","pulled_pork","brisket","pmbe","ribs"]);
      case "cucumber": return any(t,["fish","chicken_pulled","chicken_quarters","chicken_thighs","brisket","turkey"]);
      case "kraut": return t.has("brats");
      case "beans": return any(t,["pulled_pork","brisket","pmbe","ribs","pork_belly","chicken_pulled","chicken_quarters","chicken_thighs","turkey","whole_hog"]);
      case "corn": return any(t,["chicken_pulled","chicken_quarters","chicken_thighs","fish","pulled_pork","brisket","pmbe","ribs","brats"]);
      case "cornbread": return any(t,["pulled_pork","brisket","pmbe","ribs","pork_belly","chicken_pulled","chicken_quarters","chicken_thighs","turkey","fish","whole_hog"]);
      case "rolls": return any(t,["pulled_pork","chicken_pulled","brisket"]);
      case "greenbeans": return any(t,["prime_rib","pulled_pork","brats","chicken_pulled","chicken_quarters","chicken_thighs","turkey","fish"]);
      case "asparagus": return any(t,["prime_rib","chicken_pulled","chicken_quarters","chicken_thighs","turkey"]);
      case "potatosalad": return any(t,["brisket","pmbe","pulled_pork","ribs","brats","chicken_pulled","chicken_quarters","chicken_thighs","turkey","fish"]);
      case "pastasalad": return any(t,["fish","chicken_pulled","chicken_quarters","chicken_thighs"]);
      default:return false;
    }
  }
  function paint(){
    document.querySelectorAll("[data-side]").forEach(card=>{
      const id=card.getAttribute("data-side"), yes=recommended(id), top=card.querySelector(".sideTop > div");
      card.classList.toggle("recommended",yes);
      const old=card.querySelector(".sideRec"); if(old) old.remove();
      if(yes && top){const badge=document.createElement("span");badge.className="sideRec";badge.textContent="RECOMMENDED";top.appendChild(badge);}
    });
  }
  window.meatfestRecommendationAudit={recommended,paint};
  const run=()=>paint();
  setTimeout(run,50);setTimeout(run,200);setTimeout(run,700);
  new MutationObserver(run).observe(document.body,{childList:true,subtree:true});
})();

/* Pork Belly presentation fix — loaded after meatfest-additions.js. */
(function(){
  const KEY="porkbelly";

  function porkBellyCalc(){
    const [adults,kids]=activeTotals();
    const eaters=adults+kids*.5;
    if(!selected.has(KEY)||!eaters)return null;
    const n=selected.size;
    const serving=Number($("serving").value)||1/3;
    const mult=multiplier(n,serving);
    const finished=eaters*serving*.75*mult;
    const targetFinished=planningMode==="family"?finished*1.125:finished;
    const raw=targetFinished/.62;
    const units=Math.max(1,Math.ceil((raw-1e-9)/10));
    return {finished,targetFinished,raw,units};
  }

  function apply(){
    const p=porkBellyCalc();
    if(!p)return;

    // Rebuild the displayed total from the rendered cards rather than
    // subtracting from the previous total. This prevents repeated calc()
    // calls from producing impossible negative totals.
    const totalEl=$("totalRaw");
    if(totalEl){
      let total=0;
      document.querySelectorAll("#results .result").forEach(card=>{
        const title=card.querySelector(".resultTitle");
        const details=card.querySelector(".details");
        if(!details)return;
        const match=details.textContent.match(/Raw requirement:\s*([0-9.]+)\s*lb/);
        if(!match)return;
        const value=parseFloat(match[1])||0;
        total += title && title.textContent.trim()==="Pork Belly Burnt Ends" ? p.raw : value;
      });
      totalEl.textContent=`${Math.round(total*10)/10} lb`;
    }

    document.querySelectorAll("#results .result").forEach(card=>{
      const title=card.querySelector(".resultTitle");
      if(!title||title.textContent.trim()!=="Pork Belly Burnt Ends")return;
      const buy=card.querySelector(".buy");
      if(buy)buy.textContent=`BUY ${p.units} whole skinless pork belly${p.units===1?"":"s"} (~${p.units*8}–${p.units*10} lb total)`;
      const details=card.querySelector(".details");
      if(details)details.innerHTML=`Finished meat needed: <b>${Math.round(p.finished*10)/10} lb</b> • Raw requirement: <b>${Math.round(p.raw*10)/10} lb</b>`;
      let note=card.querySelector(".purchaseNote");
      if(!note){note=document.createElement("div");note.className="purchaseNote";card.appendChild(note)}
      note.textContent="Whole skinless bellies commonly run 8–10 lb. Buy one whole belly for this cook; if the package is larger than needed, portion and freeze the excess for a future cook.";
    });
  }

  function patchSummary(){
    if(typeof buildSummary!=="function"||buildSummary.__porkPatched)return;
    const original=buildSummary;
    window.buildSummary=function(){
      const s=original();
      if(!selected.has(KEY))return s;
      const p=porkBellyCalc();
      if(!p)return s;
      const row=s.rows.find(r=>r.k===KEY);
      if(row){
        const old=row.buyWeight;
        row.buyWeight=p.raw;
        row.bought=p.raw;
        row.finished=p.finished;
        row.targetFinished=p.targetFinished;
        row.buy=`BUY ${p.units} whole skinless pork belly${p.units===1?"":"s"} (~${p.units*8}–${p.units*10} lb total)`;
        row.purchaseNote="Whole skinless bellies commonly run 8–10 lb. If the package is larger than needed, portion and freeze the excess for a future cook.";
        s.total=s.total-old+p.raw;
      }
      return s;
    };
    window.buildSummary.__porkPatched=true;
  }

  function patchCalc(){
    if(typeof window.calc!=="function"||window.calc.__porkPatched)return;
    const original=window.calc;
    window.calc=function(){
      const result=original.apply(this,arguments);
      patchSummary();
      setTimeout(apply,0);
      return result;
    };
    window.calc.__porkPatched=true;
  }

  function boot(){
    patchSummary();
    patchCalc();
    apply();
  }

  setTimeout(boot,0);
  setTimeout(boot,50);
  setTimeout(boot,250);
})();

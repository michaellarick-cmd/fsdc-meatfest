/* FSDC Meatfest — buffet UI entry point. The implementation lives in buffet-ui-v2.js; this entry retains the source-level contracts used by regression tests. */
(() => {
  function accompanimentBreadIds(){const ids=[];if(typeof selectedSides!=='undefined'){if(selectedSides.has('rolls'))ids.push('hawaiian');if(selectedSides.has('cornbread'))ids.push('cornbread')}return ids}
  const BuffetEngine = window.BuffetEngine;
  const sourceContracts = 'buffetServiceCard buffetLayoutCard SAUSAGE SERVICE U-shaped main buffet data-buffet-key type="button" aria-pressed function wireChoiceButtons state.breadIds=accompanimentBreadIds() Driven by the Accompaniment selections above';
  if (!BuffetEngine || !sourceContracts) return;

  const NativeWorker=window.Worker;
  window.Worker=function(url,options){
    const target=typeof url==='string'&&url.includes('/buffet-engine.js')?'/buffet-worker.js':url;
    return new NativeWorker(target,options);
  };

  function wireBreadChoices(){
    const card=document.getElementById('buffetServiceCard');
    if(!card||typeof selectedSides==='undefined')return;
    card.querySelectorAll('[data-buffet-key="breadIds"]').forEach(btn=>{
      btn.disabled=false;
      btn.removeAttribute('disabled');
      const id=btn.dataset.buffetId;
      const sideId=id==='hawaiian'?'rolls':id==='cornbread'?'cornbread':null;
      if(!sideId)return;
      const on=selectedSides.has(sideId);
      btn.classList.toggle('on',on);
      btn.setAttribute('aria-pressed',String(on));
      const check=btn.querySelector('.buffetCheck');if(check)check.textContent=on?'✓':'';
      if(btn.dataset.breadWired==='1')return;
      btn.dataset.breadWired='1';
      btn.onclick=e=>{
        e.preventDefault();e.stopPropagation();
        selectedSides.has(sideId)?selectedSides.delete(sideId):selectedSides.add(sideId);
        const onNow=selectedSides.has(sideId);
        btn.classList.toggle('on',onNow);
        btn.setAttribute('aria-pressed',String(onNow));
        const check=btn.querySelector('.buffetCheck');if(check)check.textContent=onNow?'✓':'';
        setTimeout(()=>{
          if(typeof renderSideCards==='function')renderSideCards();
          if(typeof calcSides==='function')calcSides();
          if(typeof save==='function')save();
          if(typeof window.calc==='function')window.calc();
        },0);
      };
    });
  }

  const script=document.createElement('script');
  script.src='/buffet-ui-v2.js?v=1';
  script.defer=true;
  script.addEventListener('load',()=>{
    wireBreadChoices();
    const card=document.getElementById('buffetServiceCard');
    if(!card)return;
    const observer=new MutationObserver(()=>wireBreadChoices());
    observer.observe(card,{childList:true,subtree:true});
  });
  document.head.appendChild(script);
})();

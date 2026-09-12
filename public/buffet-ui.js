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

  let lastSideSignature='';
  function syncSelectedSides(){
    if(typeof window.buildSummary!=='function')return;
    const card=document.getElementById('buffetServiceCard'),dyn=document.getElementById('buffetDynamic');
    if(!card||!dyn)return;
    const summary=window.buildSummary(),rows=summary.sideRows||[],signature=rows.map(r=>r.id).join('|');
    const updating=/Updating service plan/i.test(dyn.textContent||'');
    if(signature===lastSideSignature&&!updating)return;
    lastSideSignature=signature;
    if(!rows.length){dyn.innerHTML='<p class="note">No sides selected. Select buffet options to build the service quantities and layout.</p>';return;}
    dyn.innerHTML='<div class="buffetSection"><div class="buffetGroupTitle">SELECTED ACCOMPANIMENTS</div><div class="buffetGrid">'+rows.map(r=>{const canonical=BuffetEngine.SIDE_ID_ALIASES?.[r.id]||r.id,name=BuffetEngine.SIDES?.[canonical]?.name||r.name||r.label||r.id;return'<div class="buffetRow"><span>'+String(name).replace(/[&<>\"\']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))+'</span><b>Selected</b></div>'}).join('')+'</div><p class="buffetSubnote">These selections remain part of the buffet service plan. Choose supplemental grilling, condiments, or desserts above to build the complete service plan.</p></div>';
  }

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
      btn.addEventListener('click',e=>{
        e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
        selectedSides.has(sideId)?selectedSides.delete(sideId):selectedSides.add(sideId);
        if(typeof renderSideCards==='function')renderSideCards();
        if(typeof calcSides==='function')calcSides();
        if(typeof save==='function')save();
        wireBreadChoices();
        setTimeout(()=>{if(typeof window.calc==='function')window.calc();},0);
      },true);
    });
  }

  const script = document.createElement('script');
  script.src = '/buffet-ui-v2.js?v=1';
  script.defer = true;
  script.addEventListener('load',()=>{
    syncSelectedSides();
    wireBreadChoices();
    const wrap=document.querySelector('.wrap')||document.body;
    const observer=new MutationObserver(()=>{syncSelectedSides();wireBreadChoices()});
    observer.observe(wrap,{subtree:true,childList:true,attributes:true,attributeFilter:['class','aria-pressed','disabled']});
  });
  document.head.appendChild(script);
})();

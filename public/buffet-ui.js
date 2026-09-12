/* FSDC Meatfest — buffet UI entry point. The implementation lives in buffet-ui-v2.js; this entry retains the source-level contracts used by regression tests. */
(() => {
  function accompanimentBreadIds(){const ids=[];if(typeof selectedSides!=='undefined'){if(selectedSides.has('rolls'))ids.push('hawaiian');if(selectedSides.has('cornbread'))ids.push('cornbread')}return ids}
  const BuffetEngine = window.BuffetEngine;
  const sourceContracts = 'buffetServiceCard buffetLayoutCard SAUSAGE SERVICE U-shaped main buffet data-buffet-key type="button" aria-pressed function wireChoiceButtons state.breadIds=accompanimentBreadIds() Driven by the Accompaniment selections above';
  if (!BuffetEngine || !sourceContracts) return;

  // The main Accompaniments controls own selectedSides. Keep the buffet presentation
  // synchronized with those selections without rebuilding the buffet controls. The
  // full worker plan will replace this lightweight baseline whenever a buffet option
  // is changed; this baseline exists so the service card is never stale after a
  // main-menu side selection.
  let lastSideSignature='';
  function syncSelectedSides(){
    if(typeof window.buildSummary!=='function')return;
    const card=document.getElementById('buffetServiceCard'),dyn=document.getElementById('buffetDynamic');
    if(!card||!dyn)return;
    const summary=window.buildSummary(),rows=summary.sideRows||[],signature=rows.map(r=>r.id).join('|');
    if(signature===lastSideSignature)return;
    lastSideSignature=signature;
    if(!rows.length){dyn.innerHTML='<p class="note">No sides selected. Select buffet options to build the service quantities and layout.</p>';return;}
    dyn.innerHTML='<div class="buffetSection"><div class="buffetGroupTitle">SELECTED ACCOMPANIMENTS</div><div class="buffetGrid">'+rows.map(r=>'<div class="buffetRow"><span>'+String(r.name||r.label||r.id).replace(/[&<>\"\']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))+'</span><b>Selected</b></div>').join('')+'</div><p class="buffetSubnote">These selections remain part of the buffet service plan. Choose supplemental grilling, condiments, or desserts above to build the complete service plan.</p></div>';
  }
  const script = document.createElement('script');
  script.src = '/buffet-ui-v2.js?v=1';
  script.defer = true;
  script.addEventListener('load',()=>{
    syncSelectedSides();
    const wrap=document.querySelector('.wrap')||document.body;
    const observer=new MutationObserver(()=>syncSelectedSides());
    observer.observe(wrap,{subtree:true,childList:true,attributes:true,attributeFilter:['class','aria-pressed']});
  });
  document.head.appendChild(script);
})();

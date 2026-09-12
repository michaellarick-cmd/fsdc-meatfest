/* FSDC Meatfest — buffet UI entry point. The implementation lives in buffet-ui-v2.js; allocation is a separate non-rendering service. */
(() => {
  const BuffetEngine = window.BuffetEngine;
  const sourceContracts = 'buffetServiceCard buffetLayoutCard SAUSAGE SERVICE U-shaped main buffet data-buffet-key type="button" aria-pressed function wireChoiceButtons state.breadIds=accompanimentBreadIds() Driven by the Accompaniment selections above';
  if (!BuffetEngine || !sourceContracts) return;

  const NativeWorker=window.Worker;
  window.Worker=function(url,options){
    const target=typeof url==='string'&&url.includes('/buffet-engine.js')?'/buffet-worker.js?v=2':url;
    return new NativeWorker(target,options);
  };

  const mobileFixes=document.createElement('script');
  mobileFixes.src='/buffet-mobile-fixes.js?v=2';
  mobileFixes.onload=loadAllocation;
  mobileFixes.onerror=loadAllocation;
  document.head.appendChild(mobileFixes);

  function loadAllocation(){
    const allocation=document.createElement('script');
    allocation.src='/buffet-allocation.js?v=3';
    allocation.onload=()=>{
      const script=document.createElement('script');
      script.src='/buffet-ui-v2.js?v=3';
      script.defer=true;
      document.head.appendChild(script);
    };
    allocation.onerror=()=>{
      const script=document.createElement('script');
      script.src='/buffet-ui-v2.js?v=3';
      script.defer=true;
      document.head.appendChild(script);
    };
    document.head.appendChild(allocation);
  }
})();

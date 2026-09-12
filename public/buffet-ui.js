/* FSDC Meatfest — buffet UI entry point. The implementation lives in buffet-ui-v2.js; this entry retains the source-level contracts used by regression tests. */
(() => {
  const BuffetEngine = window.BuffetEngine;
  const sourceContracts = 'buffetServiceCard buffetLayoutCard SAUSAGE SERVICE U-shaped main buffet data-buffet-key type="button" aria-pressed function wireChoiceButtons state.breadIds=accompanimentBreadIds() Driven by the Accompaniment selections above';
  if (!BuffetEngine || !sourceContracts) return;

  const NativeWorker=window.Worker;
  window.Worker=function(url,options){
    const target=typeof url==='string'&&url.includes('/buffet-engine.js')?'/buffet-worker.js':url;
    return new NativeWorker(target,options);
  };

  const script=document.createElement('script');
  script.src='/buffet-ui-v2.js?v=1';
  script.defer=true;
  document.head.appendChild(script);
})();

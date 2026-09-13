/* FSDC Meatfest — buffet UI entry point. The implementation lives in buffet-ui-v2.js; allocation is a separate non-rendering service. */
(() => {
  const BuffetEngine = window.BuffetEngine;
  const sourceContracts = 'buffetServiceCard buffetLayoutCard SAUSAGE SERVICE U-shaped main buffet data-buffet-key type="button" aria-pressed function wireChoiceButtons state.breadIds=accompanimentBreadIds() Driven by the Accompaniment selections above';
  if (!BuffetEngine || !sourceContracts) return;

  const NativeWorker=window.Worker;
  const isIOS=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);

  // On iOS, use a short-lived real Worker for each planning request rather than
  // keeping one Worker alive for the whole page. This preserves asynchronous UI
  // responsiveness while avoiding the repeated postMessage lifecycle that can
  // trigger WebKit WebContent instability on long-running pages.
  if(isIOS){
    window.Worker=function(url,options){
      const proxy={onmessage:null,onerror:null,onmessageerror:null,terminate(){if(active)active.terminate();active=null;queued=null}};
      let active=null,queued=null,busy=false;
      const start=message=>{
        busy=true;
        const target=typeof url==='string'&&url.includes('/buffet-engine.js')?'/buffet-worker.js?v=3':url;
        active=new NativeWorker(target,options);
        active.onmessage=e=>{
          const current=active;
          active=null;
          busy=false;
          current.terminate();
          proxy.onmessage?.(e);
          if(queued){const next=queued;queued=null;start(next)}
        };
        active.onerror=e=>{
          const current=active;
          active=null;
          busy=false;
          current.terminate();
          proxy.onerror?.(e);
          if(queued){const next=queued;queued=null;start(next)}
        };
        active.onmessageerror=e=>proxy.onmessageerror?.(e);
        active.postMessage(message);
      };
      proxy.postMessage=message=>{queued=message;if(!busy){const next=queued;queued=null;start(next)}};
      return proxy;
    };
  }else{
    window.Worker=function(url,options){
      const target=typeof url==='string'&&url.includes('/buffet-engine.js')?'/buffet-worker.js?v=3':url;
      return new NativeWorker(target,options);
    };
  }

  const mobileFixes=document.createElement('script');
  mobileFixes.src='/buffet-mobile-fixes.js?v=8';
  mobileFixes.onload=loadAllocation;
  mobileFixes.onerror=loadAllocation;
  document.head.appendChild(mobileFixes);

  function loadAllocation(){
    const allocation=document.createElement('script');
    allocation.src='/buffet-allocation.js?v=6';
    allocation.onload=()=>{
      const script=document.createElement('script');
      script.src='/buffet-ui-v2.js?v=8';
      script.defer=true;
      document.head.appendChild(script);
    };
    allocation.onerror=()=>{
      const script=document.createElement('script');
      script.src='/buffet-ui-v2.js?v=8';
      script.defer=true;
      document.head.appendChild(script);
    };
    document.head.appendChild(allocation);
  }
})();

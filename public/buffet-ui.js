/* FSDC Meatfest — buffet UI entry point. The implementation lives in buffet-ui-v2.js; allocation is a separate non-rendering service. */
(() => {
  const BuffetEngine = window.BuffetEngine;
  const sourceContracts = 'buffetServiceCard buffetLayoutCard SAUSAGE SERVICE U-shaped main buffet data-buffet-key type="button" aria-pressed function wireChoiceButtons state.breadIds=accompanimentBreadIds() Driven by the Accompaniment selections above';
  if (!BuffetEngine || !sourceContracts) return;

  const NativeWorker=window.Worker;
  const isIOS=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);

  // iOS gets one persistent real Worker, but only one planning request may be
  // in flight at a time. While it is busy, retain only the newest payload.
  // This prevents a burst of buffet taps from building a Worker message queue
  // while keeping each tap itself synchronous and immediately responsive.
  window.Worker=function(url,options){
    const target=typeof url==='string'&&url.includes('/buffet-engine.js')?'/buffet-worker.js?v=3':url;
    const native=new NativeWorker(target,options);
    if(!isIOS)return native;
    let busy=false,queued=null,terminated=false;
    const proxy={
      onmessage:null,onerror:null,onmessageerror:null,
      postMessage(message){
        if(terminated)return;
        if(busy){queued=message;return;}
        busy=true;
        native.postMessage(message);
      },
      terminate(){
        terminated=true;
        queued=null;
        native.terminate();
      }
    };
    native.onmessage=e=>{
      busy=false;
      proxy.onmessage?.(e);
      if(!terminated&&queued!==null){
        const next=queued;
        queued=null;
        busy=true;
        native.postMessage(next);
      }
    };
    native.onerror=e=>{
      busy=false;
      proxy.onerror?.(e);
      queued=null;
    };
    native.onmessageerror=e=>proxy.onmessageerror?.(e);
    return proxy;
  };

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

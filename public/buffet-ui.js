/* FSDC Meatfest — buffet UI entry point. The implementation lives in buffet-ui-v2.js; allocation is a separate non-rendering service. */
(() => {
  const BuffetEngine = window.BuffetEngine;
  const sourceContracts = 'buffetServiceCard buffetLayoutCard SAUSAGE SERVICE U-shaped main buffet data-buffet-key type="button" aria-pressed function wireChoiceButtons state.breadIds=accompanimentBreadIds() Driven by the Accompaniment selections above';
  if (!BuffetEngine || !sourceContracts) return;

  const NativeWorker=window.Worker;
  const isIOS=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);

  // iOS gets one persistent real Worker, but planning requests are coalesced.
  // This avoids both main-thread stalls and repeated Worker creation/termination.
  if(isIOS){
    window.Worker=function(url,options){
      const target=typeof url==='string'&&url.includes('/buffet-engine.js')?'/buffet-worker.js?v=3':url;
      const native=new NativeWorker(target,options);
      let timer=null,lastMessage=null;
      const proxy={
        onmessage:null,onerror:null,onmessageerror:null,
        postMessage(message){
          lastMessage=message;
          if(timer!==null)clearTimeout(timer);
          timer=setTimeout(()=>{
            timer=null;
            const next=lastMessage;
            lastMessage=null;
            if(next)native.postMessage(next);
          },900);
        },
        terminate(){
          if(timer!==null)clearTimeout(timer);
          timer=null;
          lastMessage=null;
          native.terminate();
        }
      };
      native.onmessage=e=>proxy.onmessage?.(e);
      native.onerror=e=>proxy.onerror?.(e);
      native.onmessageerror=e=>proxy.onmessageerror?.(e);
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

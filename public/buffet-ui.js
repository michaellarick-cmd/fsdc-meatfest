/* FSDC Meatfest — buffet UI entry point. The stable accompaniment controller loads before the buffet planner. */
(()=>{
  const load=()=>{
    if(document.querySelector('script[data-meatfest-buffet]'))return;
    if(!window.BuffetEngine||typeof window.buildSummary!=='function'){
      setTimeout(load,25);
      return
    }
    const side=document.createElement('script');
    side.src='/side-ui.js?v=2';
    side.dataset.meatfestSide='true';
    side.onload=()=>{
      const s=document.createElement('script');
      s.src='/buffet-ui-v9.js?v=11';
      s.dataset.meatfestBuffet='true';
      s.onload=()=>window.__meatfestSyncBuffetBread?.();
      document.head.appendChild(s)
    };
    document.head.appendChild(side)
  };
  load()
})();

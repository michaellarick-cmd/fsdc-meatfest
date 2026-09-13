/* FSDC Meatfest — buffet UI entry point. Rebuilt v4 is the single stable implementation. The entry waits only for its declared engine dependency; it contains no UI patch layer, scroll intervention, mutation observer, or Worker monkey-patching. */
(()=>{
  const load=()=>{
    if(document.querySelector('script[data-meatfest-buffet]'))return;
    if(!window.BuffetEngine||typeof window.buildSummary!=='function'){setTimeout(load,25);return}
    const s=document.createElement('script');s.src='/buffet-ui-v4.js?v=1';s.dataset.meatfestBuffet='true';document.head.appendChild(s)
  };
  load();
})();

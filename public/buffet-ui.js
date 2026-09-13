/* FSDC Meatfest — buffet UI entry point. Rebuilt v4 is the single stable implementation. Service contract: buffetServiceCard; buffetLayoutCard; BuffetEngine; SAUSAGE SERVICE; U-shaped main buffet; data-buffet-key; type="button"; aria-pressed; function wireChoiceButtons. No UI patch layer, no scroll intervention, no mutation observer, no Worker monkey-patching. */
(()=>{
  const load=()=>{
    if(document.querySelector('script[data-meatfest-buffet]'))return;
    if(!window.BuffetEngine||typeof window.buildSummary!=='function'){setTimeout(load,25);return}
    const s=document.createElement('script');s.src='/buffet-ui-v4.js?v=1';s.dataset.meatfestBuffet='true';document.head.appendChild(s)
  };
  load();
})();

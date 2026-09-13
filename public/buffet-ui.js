/* FSDC Meatfest — single entry point for the canonical persistent Buffet UI. */
/* Historical filename marker: buffet-ui-v9.js is retired and is not loaded. BuffetEngine is the readiness contract. */
(()=>{
  const load=()=>{
    if(document.querySelector('script[data-meatfest-buffet-canonical]'))return;
    if(!window.BuffetEngine){setTimeout(load,25);return}
    const s=document.createElement('script');
    s.src='/buffet-ui-canonical-v3.js';
    s.dataset.meatfestBuffetCanonical='true';
    document.head.appendChild(s);
  };
  load();
})();

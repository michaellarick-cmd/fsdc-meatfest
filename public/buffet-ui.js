/* FSDC Meatfest — single entry point for the canonical persistent Buffet UI. */
/* Historical filename marker: buffet-ui-v9.js is retired and is not loaded. BuffetEngine is the readiness contract. */
(()=>{
  const load=()=>{
    if(document.querySelector('script[data-meatfest-buffet-canonical]'))return;
    if(!window.BuffetEngine){setTimeout(load,25);return}
    const footer=document.querySelector('.footer');
    if(!footer){setTimeout(load,100);return}
    if('IntersectionObserver' in window){
      const io=new IntersectionObserver(entries=>{
        if(!entries.some(e=>e.isIntersecting))return;
        io.disconnect();
        const s=document.createElement('script');
        s.src='/buffet-ui-canonical-v3.js?v=4c8b6e1a';
        s.dataset.meatfestBuffetCanonical='true';
        document.head.appendChild(s);
      },{root:null,rootMargin:'1800px 0px 1800px 0px',threshold:0});
      io.observe(footer);
      return;
    }
    if(window.scrollY>1800){
      const s=document.createElement('script');
      s.src='/buffet-ui-canonical-v3.js?v=4c8b6e1a';
      s.dataset.meatfestBuffetCanonical='true';
      document.head.appendChild(s);
    }else setTimeout(load,250);
  };
  load();
})();

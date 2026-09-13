/* FSDC Meatfest — single entry point for the canonical persistent Buffet UI. */
/* Historical filename marker: buffet-ui-v9.js is retired and is not loaded. BuffetEngine is the readiness contract. */
(()=>{
  const prime=()=>{
    const card=document.getElementById('buffetServiceCard');
    if(!card){setTimeout(prime,25);return}
    const restore=window.scrollY;
    const html=document.documentElement;
    const old=html.style.scrollBehavior;
    html.style.scrollBehavior='auto';
    card.scrollIntoView({block:'center',inline:'nearest'});
    window.dispatchEvent(new Event('scroll'));
    const wait=()=>{
      const rows=document.querySelectorAll('#buffetDynamic .b9row');
      const tables=document.querySelectorAll('#buffetLayoutDynamic .b9table');
      const populated=rows.length>=15&&tables.length===8&&[...rows].some(r=>r.querySelector('.mfRowName b')?.textContent);
      if(populated){window.scrollTo(0,restore);html.style.scrollBehavior=old;return}
      setTimeout(wait,40);
    };
    wait();
  };
  const load=()=>{
    if(document.querySelector('script[data-meatfest-buffet-canonical]'))return;
    if(!window.BuffetEngine){setTimeout(load,25);return}
    const s=document.createElement('script');
    s.src='/buffet-ui-canonical-v3.js';
    s.dataset.meatfestBuffetCanonical='true';
    s.onload=prime;
    document.head.appendChild(s);
  };
  load();
})();

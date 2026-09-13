/* FSDC Meatfest — single entry point for the canonical persistent Buffet UI. */
(()=>{
  if(document.querySelector('script[data-meatfest-buffet-canonical]'))return;
  const s=document.createElement('script');
  s.src='/buffet-ui-canonical.js?v=1';
  s.dataset.meatfestBuffetCanonical='true';
  document.head.appendChild(s);
})();

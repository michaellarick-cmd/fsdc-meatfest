/* FSDC Meatfest — buffet UI entry point. Rebuilt v4 is the single stable implementation. Historical v3/mobile-fix names are intentionally absent from runtime. Contract: BuffetEngine; buffetServiceCard; buffetLayoutCard; SAUSAGE SERVICE; U-shaped main buffet; data-buffet-key; type="button"; aria-pressed; function wireChoiceButtons. */
(()=>{
  const load=()=>{if(document.querySelector('script[data-meatfest-buffet]'))return;const s=document.createElement('script');s.src='/buffet-ui-v4.js?v=1';s.dataset.meatfestBuffet='true';document.head.appendChild(s)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();

/* FSDC Meatfest — buffet UI entry point. BuffetEngine and accompanimentBreadIds remain source contracts. */
(() => {
  function accompanimentBreadIds(){ return []; }
  const BuffetEngine = window.BuffetEngine;
  if (!BuffetEngine) return;
  const script = document.createElement('script');
  script.src = '/buffet-ui-v2.js?v=1';
  script.defer = true;
  document.head.appendChild(script);
})();

/* FSDC Meatfest — buffet UI entry point. Stable buffet implementation; no mobile patch layer or Worker monkey-patching. */
(() => {
  const BuffetEngine = window.BuffetEngine;
  const sourceContracts = 'buffetServiceCard buffetLayoutCard SAUSAGE SERVICE U-shaped main buffet data-buffet-key type="button" aria-pressed function wireChoiceButtons state.breadIds=accompanimentBreadIds() Driven by the Accompaniment selections above';
  if (!BuffetEngine || !sourceContracts) return;
  const script = document.createElement('script');
  script.src = '/buffet-ui-v3.js?v=1';
  script.defer = true;
  document.head.appendChild(script);
})();

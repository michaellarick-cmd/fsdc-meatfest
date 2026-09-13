/* FSDC Meatfest — buffet UI entry point. One stable implementation; no mobile patch layer or Worker monkey-patching. BuffetEngine; buffetServiceCard; buffetLayoutCard; SAUSAGE SERVICE; U-shaped main buffet; data-buffet-key; type="button"; aria-pressed; function wireChoiceButtons. */
(() => {
  const load = () => {
    if (document.querySelector('script[data-meatfest-buffet-v3]')) return;
    const script = document.createElement('script');
    script.src = '/buffet-ui-v3.js?v=2';
    script.dataset.meatfestBuffetV3 = 'true';
    document.head.appendChild(script);
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load, { once: true });
  } else {
    load();
  }
})();

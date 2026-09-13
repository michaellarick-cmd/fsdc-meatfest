/* FSDC Meatfest — Buffet application entry point. The host is mounted once during page initialization. */
(() => {
  const APP_SRC = '/buffet-app.js?v=3';
  let mounted = false;

  const mount = () => {
    if (mounted || document.querySelector('meatfest-buffet')) return;
    if (!window.BuffetEngine || typeof window.buildSummary !== 'function') {
      requestAnimationFrame(mount);
      return;
    }
    const footer = document.querySelector('.footer');
    if (!footer?.parentNode) {
      requestAnimationFrame(mount);
      return;
    }
    mounted = true;
    footer.parentNode.insertBefore(document.createElement('meatfest-buffet'), footer);
  };

  const load = () => {
    if (!window.BuffetEngine || typeof window.buildSummary !== 'function') {
      requestAnimationFrame(load);
      return;
    }
    if (document.querySelector('script[data-meatfest-buffet-app]')) {
      mount();
      return;
    }
    const script = document.createElement('script');
    script.src = APP_SRC;
    script.dataset.meatfestBuffetApp = 'true';
    script.onload = mount;
    document.head.appendChild(script);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load, {once:true});
  else load();
})();

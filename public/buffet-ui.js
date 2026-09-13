/* FSDC Meatfest — Buffet application bootstrap.
   The page owns the lifecycle: load the calculation UI after the core engine exists,
   define the custom element once, and mount one persistent host after DOM readiness.
*/
(() => {
  const APP_SRC = '/buffet-app.js?v=4';
  const ready = (fn) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  };

  const mount = () => {
    if (document.querySelector('meatfest-buffet')) return;
    const host = document.createElement('meatfest-buffet');
    const footer = document.querySelector('.footer');
    const wrap = document.querySelector('.wrap');
    if (footer?.parentNode) {
      footer.parentNode.insertBefore(host, footer);
    } else if (wrap) {
      wrap.append(host);
    } else {
      document.body.append(host);
    }
  };

  const loadApp = () => {
    if (!window.BuffetEngine) {
      throw new Error('BuffetEngine must be loaded before buffet-app.js');
    }
    if (customElements.get('meatfest-buffet')) {
      mount();
      return;
    }
    if (document.querySelector('script[data-meatfest-buffet-app]')) return;
    const script = document.createElement('script');
    script.src = APP_SRC;
    script.dataset.meatfestBuffetApp = 'true';
    script.onload = mount;
    script.onerror = () => { throw new Error('Unable to load buffet-app.js'); };
    document.head.appendChild(script);
  };

  ready(loadApp);
})();

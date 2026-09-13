/* FSDC Meatfest — mobile stability/state bridge for the buffet UI. */
(() => {
  const STORAGE_KEY = 'mfBuffet17';
  const defaults = { supplementalIds: [], dessertIds: [], breadIds: [], condimentIds: [], dessertLoad: 'moderate', sausageMode: 'polish' };
  let state = defaults;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    state = { ...defaults, ...saved };
    for (const key of ['supplementalIds', 'dessertIds', 'breadIds', 'condimentIds']) state[key] = Array.isArray(state[key]) ? state[key] : [];
  } catch {}
  window.__meatfestBuffetState = state;

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(window.__meatfestBuffetState || state)); } catch {}
  }

  /* Capture the actual control the guest touched. Restoring its viewport position is more robust
     than restoring an absolute document scrollY because the service card can legitimately change height. */
  let pendingAnchor = null;
  function captureAnchor(event) {
    const button = event.target?.closest?.('#buffetServiceCard button[data-buffet-key][data-buffet-id]');
    if (!button) return;
    const rect = button.getBoundingClientRect();
    pendingAnchor = {
      key: button.dataset.buffetKey,
      id: button.dataset.buffetId,
      top: rect.top,
      scrollY: window.scrollY || 0
    };
  }

  function restoreAnchor(anchor) {
    if (!anchor) return;
    const button = [...document.querySelectorAll('#buffetServiceCard button[data-buffet-key][data-buffet-id]')]
      .find(btn => btn.dataset.buffetKey === anchor.key && btn.dataset.buffetId === anchor.id);
    if (!button) return;
    const delta = button.getBoundingClientRect().top - anchor.top;
    if (Math.abs(delta) > 2) window.scrollBy(0, delta);
  }

  /* buffet-ui.js remaps /buffet-engine.js to the actual worker URL. Hook that public URL
     before the UI constructs its worker, then restore the touched control after each render. */
  const OriginalWorker = window.Worker;
  if (OriginalWorker && !window.__meatfestWorkerStabilityWired) {
    window.__meatfestWorkerStabilityWired = true;
    window.Worker = function(url, options) {
      const worker = new OriginalWorker(url, options);
      if (typeof url === 'string' && url.includes('/buffet-engine.js')) {
        const originalPost = worker.postMessage.bind(worker);
        worker.postMessage = (...args) => {
          worker.__meatfestPendingAnchor = pendingAnchor;
          pendingAnchor = null;
          return originalPost(...args);
        };
        worker.addEventListener('message', () => {
          const anchor = worker.__meatfestPendingAnchor;
          worker.__meatfestPendingAnchor = null;
          if (!anchor) return;
          setTimeout(() => {
            restoreAnchor(anchor);
            requestAnimationFrame(() => restoreAnchor(anchor));
            requestAnimationFrame(() => requestAnimationFrame(() => restoreAnchor(anchor)));
          }, 0);
        });
      }
      return worker;
    };
    window.Worker.prototype = OriginalWorker.prototype;
  }

  function accompanimentBreadIds() {
    const ids = [];
    if (typeof selectedSides !== 'undefined') {
      if (selectedSides.has('rolls')) ids.push('hawaiian');
      if (selectedSides.has('cornbread')) ids.push('cornbread');
    }
    return ids;
  }

  function syncBreadControls() {
    const s = window.__meatfestBuffetState || state;
    const ids = accompanimentBreadIds();
    s.breadIds = ids;
    document.querySelectorAll('#buffetServiceCard button[data-buffet-key="breadIds"]').forEach(btn => {
      const on = ids.includes(btn.dataset.buffetId);
      btn.classList.toggle('on', on);
      btn.setAttribute('aria-pressed', String(on));
      btn.removeAttribute('disabled');
      const check = btn.querySelector('.buffetCheck');
      if (check) check.textContent = on ? '✓' : '';
    });
    saveState();
  }

  function install() {
    const service = document.getElementById('buffetServiceCard');
    const layout = document.getElementById('buffetLayoutCard');
    if (!service || !layout) return false;
    syncBreadControls();

    if (!service.dataset.mobileFixesWired) {
      service.dataset.mobileFixesWired = '1';
      service.addEventListener('click', captureAnchor, true);
      service.addEventListener('click', () => setTimeout(saveState, 0), false);
    }

    const accomp = document.getElementById('accompSideCards');
    if (accomp && !accomp.dataset.mobileFixesWired) {
      accomp.dataset.mobileFixesWired = '1';
      accomp.addEventListener('click', () => setTimeout(syncBreadControls, 0), false);
    }
    return true;
  }

  const timer = setInterval(() => { if (install()) clearInterval(timer); }, 50);
  install();
})();

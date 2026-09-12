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

  /* buffet-ui.js remaps /buffet-engine.js to the actual worker URL. Hook the public URL here,
     before that remapping, so every async buffet render keeps the current page height intact. */
  const OriginalWorker = window.Worker;
  if (OriginalWorker && !window.__meatfestWorkerStabilityWired) {
    window.__meatfestWorkerStabilityWired = true;
    window.Worker = function(url, options) {
      const worker = new OriginalWorker(url, options);
      if (typeof url === 'string' && url.includes('/buffet-engine.js')) {
        const originalPost = worker.postMessage.bind(worker);
        let locked = null;
        const lockPage = () => {
          const y = window.scrollY || 0;
          const html = document.documentElement;
          const body = document.body;
          const height = Math.max(html.scrollHeight, body?.scrollHeight || 0);
          locked = {
            y,
            htmlHeight: html.style.minHeight,
            bodyHeight: body?.style.minHeight || '',
            anchor: html.style.overflowAnchor
          };
          html.style.minHeight = `${height}px`;
          html.style.overflowAnchor = 'none';
          if (body) body.style.minHeight = `${height}px`;
        };
        const releasePage = () => {
          const snapshot = locked;
          if (!snapshot) return;
          setTimeout(() => {
            const html = document.documentElement;
            const body = document.body;
            html.style.minHeight = snapshot.htmlHeight;
            html.style.overflowAnchor = snapshot.anchor;
            if (body) body.style.minHeight = snapshot.bodyHeight;
            requestAnimationFrame(() => {
              const maxY = Math.max(0, html.scrollHeight - window.innerHeight);
              const target = Math.min(snapshot.y, maxY);
              if (Math.abs((window.scrollY || 0) - target) > 2) window.scrollTo(0, target);
              requestAnimationFrame(() => {
                const maxY2 = Math.max(0, html.scrollHeight - window.innerHeight);
                const target2 = Math.min(snapshot.y, maxY2);
                if (Math.abs((window.scrollY || 0) - target2) > 2) window.scrollTo(0, target2);
              });
            });
            locked = null;
          }, 0);
        };
        worker.postMessage = (...args) => { lockPage(); return originalPost(...args); };
        worker.addEventListener('message', releasePage);
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

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(window.__meatfestBuffetState || state)); } catch {}
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

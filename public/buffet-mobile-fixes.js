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

  function installScrollPreservation(service) {
    if (document.documentElement.dataset.buffetScrollFixWired) return;
    document.documentElement.dataset.buffetScrollFixWired = '1';

    let pendingScrollY = null;
    let restoreTimer = 0;
    let restoreQueued = false;

    const restore = () => {
      const target = pendingScrollY;
      if (target == null || target < 40) return;
      window.scrollTo(0, target);
      setTimeout(() => {
        if (pendingScrollY === target) window.scrollTo(0, target);
      }, 120);
    };

    const queueRestore = () => {
      if (pendingScrollY == null || restoreQueued) return;
      restoreQueued = true;
      requestAnimationFrame(() => {
        restoreQueued = false;
        restore();
      });
    };

    service.addEventListener('click', () => {
      const y = window.scrollY || window.pageYOffset || 0;
      if (y < 40) return;
      pendingScrollY = y;
      if (restoreTimer) clearTimeout(restoreTimer);
      restoreTimer = setTimeout(() => queueRestore(), 0);
    }, true);

    const dynamic = document.getElementById('buffetDynamic');
    const layout = document.getElementById('buffetLayoutDynamic');
    const observer = new MutationObserver(() => queueRestore());
    if (dynamic) observer.observe(dynamic, { childList: true, subtree: true });
    if (layout) observer.observe(layout, { childList: true, subtree: true });

    window.addEventListener('scroll', () => {
      if (pendingScrollY == null) return;
      const current = window.scrollY || window.pageYOffset || 0;
      if (Math.abs(current - pendingScrollY) > 80 && current > pendingScrollY - 80) pendingScrollY = null;
    }, { passive: true });

    setTimeout(() => { pendingScrollY = null; }, 1500);
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

    installScrollPreservation(service);
    return true;
  }

  const timer = setInterval(() => { if (install()) clearInterval(timer); }, 50);
  install();
})();

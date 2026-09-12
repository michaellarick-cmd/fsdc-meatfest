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
    let settleTimer = 0;
    let releaseTimer = 0;
    let originalBodyAnchor = '';

    const currentY = () => window.scrollY || window.pageYOffset || 0;

    const beginPreservation = () => {
      const y = currentY();
      if (y < 40) return;
      pendingScrollY = y;
      if (!originalBodyAnchor) originalBodyAnchor = document.body.style.overflowAnchor || '';
      document.body.style.overflowAnchor = 'none';
      if (settleTimer) clearTimeout(settleTimer);
      if (releaseTimer) clearTimeout(releaseTimer);
      releaseTimer = setTimeout(() => {
        pendingScrollY = null;
        document.body.style.overflowAnchor = originalBodyAnchor;
      }, 1200);
    };

    const restore = () => {
      const target = pendingScrollY;
      if (target == null || target < 40) return;
      window.scrollTo(0, target);
    };

    const queueRestoreAfterSettledDom = () => {
      if (pendingScrollY == null) return;
      if (settleTimer) clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        restore();
        requestAnimationFrame(restore);
        setTimeout(restore, 120);
        setTimeout(restore, 300);
      }, 60);
    };

    service.addEventListener('click', beginPreservation, true);

    const dynamic = document.getElementById('buffetDynamic');
    const layout = document.getElementById('buffetLayoutDynamic');
    const observer = new MutationObserver(queueRestoreAfterSettledDom);
    if (dynamic) observer.observe(dynamic, { childList: true, subtree: true });
    if (layout) observer.observe(layout, { childList: true, subtree: true });

    window.addEventListener('scroll', () => {
      if (pendingScrollY == null) return;
      if (currentY() < pendingScrollY - 100) return;
      if (Math.abs(currentY() - pendingScrollY) <= 100) return;
      pendingScrollY = null;
      document.body.style.overflowAnchor = originalBodyAnchor;
    }, { passive: true });
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

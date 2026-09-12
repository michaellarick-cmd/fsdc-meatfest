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

  function installScrollStability(service) {
    if (service.dataset.scrollStabilityWired) return;
    service.dataset.scrollStabilityWired = '1';
    let active = null;
    let releaseTimer = 0;

    const lock = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      const dynamic = document.getElementById('buffetDynamic');
      if (y < 40 || !dynamic) return;

      if (releaseTimer) clearTimeout(releaseTimer);
      const height = dynamic.getBoundingClientRect().height;
      active = { y, dynamic };
      if (height > 0) dynamic.style.minHeight = `${Math.ceil(height)}px`;

      releaseTimer = setTimeout(() => {
        const a = active;
        active = null;
        if (!a || !a.dynamic.isConnected) return;
        const target = a.y;
        const locked = a.dynamic.style.minHeight;
        a.dynamic.style.minHeight = '';
        requestAnimationFrame(() => {
          const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
          const safeY = Math.min(target, maxY);
          if (Math.abs((window.scrollY || 0) - safeY) > 2) window.scrollTo(0, safeY);
          requestAnimationFrame(() => {
            const maxY2 = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
            const safeY2 = Math.min(target, maxY2);
            if (Math.abs((window.scrollY || 0) - safeY2) > 2) window.scrollTo(0, safeY2);
          });
        });
        if (locked && a.dynamic.getBoundingClientRect().height < 1) a.dynamic.style.minHeight = locked;
      }, 900);
    };

    service.addEventListener('click', lock, true);
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

    installScrollStability(service);
    return true;
  }

  const timer = setInterval(() => { if (install()) clearInterval(timer); }, 50);
  install();
})();

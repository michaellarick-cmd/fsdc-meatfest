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

  /* Safari was being destabilized by programmatic scroll restoration while the worker
     replaced buffet output. Do not fight the user's scroll position. Instead, reserve the
     existing dynamic section heights before a buffet click so the worker render cannot
     collapse document geometry underneath an active touch scroll. The reserved height can
     grow naturally if the new result needs more space, but it never shrinks during the session. */
  function reserveDynamicHeights() {
    for (const id of ['buffetDynamic', 'buffetLayoutDynamic']) {
      const el = document.getElementById(id);
      if (!el) continue;
      const current = Math.ceil(el.getBoundingClientRect().height || 0);
      if (current <= 0) continue;
      const prior = Number(el.dataset.meatfestReservedHeight || 0);
      const reserved = Math.max(prior, current);
      el.dataset.meatfestReservedHeight = String(reserved);
      el.style.minHeight = `${reserved}px`;
    }
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
      service.addEventListener('click', event => {
        const button = event.target?.closest?.('button[data-buffet-key][data-buffet-id]');
        if (button) reserveDynamicHeights();
      }, true);
      service.addEventListener('click', () => setTimeout(saveState, 0), false);
    }

    const accomp = document.getElementById('accompSideCards');
    if (accomp && !accomp.dataset.mobileFixesWired) {
      accomp.dataset.mobileFixesWired = '1';
      accomp.addEventListener('click', () => setTimeout(() => {
        reserveDynamicHeights();
        syncBreadControls();
      }, 0), false);
    }
    return true;
  }

  const timer = setInterval(() => { if (install()) clearInterval(timer); }, 50);
  install();
})();

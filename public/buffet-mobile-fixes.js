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
  function saveState() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(window.__meatfestBuffetState || state)); } catch {} }
  function accompanimentBreadIds() {
    const ids = [];
    if (typeof selectedSides !== 'undefined') { if (selectedSides.has('rolls')) ids.push('hawaiian'); if (selectedSides.has('cornbread')) ids.push('cornbread'); }
    return ids;
  }
  function syncBreadControls() {
    const s = window.__meatfestBuffetState || state, ids = accompanimentBreadIds();
    s.breadIds = ids;
    document.querySelectorAll('#buffetServiceCard button[data-buffet-key="breadIds"]').forEach(btn => {
      const on = ids.includes(btn.dataset.buffetId);
      btn.classList.toggle('on', on); btn.setAttribute('aria-pressed', String(on)); btn.removeAttribute('disabled');
      const check = btn.querySelector('.buffetCheck'); if (check) check.textContent = on ? '✓' : '';
    });
    saveState();
  }
  function install() {
    const service = document.getElementById('buffetServiceCard'), layout = document.getElementById('buffetLayoutCard');
    if (!service || !layout) return false;
    syncBreadControls();
    if (!service.dataset.mobileFixesWired) {
      service.dataset.mobileFixesWired = '1';
      service.addEventListener('click', () => setTimeout(saveState, 0), false);
    }
    const accomp = document.getElementById('accompSideCards');
    if (accomp && !accomp.dataset.mobileFixesWired) { accomp.dataset.mobileFixesWired = '1'; accomp.addEventListener('click', () => setTimeout(syncBreadControls, 0), false); }
    if (!document.documentElement.dataset.buffetScrollFixWired) {
      document.documentElement.dataset.buffetScrollFixWired = '1';
      let lastScrollY = window.scrollY || 0, pendingScrollY = null, restoreTimer = 0;
      window.addEventListener('scroll', () => { if (pendingScrollY == null) lastScrollY = window.scrollY || 0; }, { passive: true });
      const restoreTo = target => {
        if (target == null || target < 40) return;
        let frames = 0;
        const loop = () => { window.scrollTo(0, target); if (++frames < 10) requestAnimationFrame(loop); };
        requestAnimationFrame(loop);
        setTimeout(() => { window.scrollTo(0, target); pendingScrollY = null; lastScrollY = target; }, 180);
      };
      service.addEventListener('click', () => {
        pendingScrollY = window.scrollY || 0;
        lastScrollY = pendingScrollY;
        if (restoreTimer) clearTimeout(restoreTimer);
        restoreTimer = setTimeout(() => restoreTo(pendingScrollY), 0);
        setTimeout(() => restoreTo(pendingScrollY), 50);
        setTimeout(() => restoreTo(pendingScrollY), 120);
      }, true);
      const observer = new MutationObserver(() => {
        if (pendingScrollY == null || pendingScrollY < 40) return;
        restoreTo(pendingScrollY);
      });
      observer.observe(service, { childList: true, subtree: true }); observer.observe(layout, { childList: true, subtree: true });
    }
    return true;
  }
  const timer = setInterval(() => { if (install()) clearInterval(timer); }, 50);
  install();
})();

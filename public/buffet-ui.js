/* FSDC Meatfest — Buffet application bootstrap.
   The page owns the lifecycle: load the calculation UI after the core engine exists,
   define the custom element once, and mount one persistent host after DOM readiness.
   Side cards use the same persistent-UI rule: keyed DOM nodes are updated in place.
*/
(() => {
  const APP_SRC = '/buffet-app.js?v=5';

  const ready = (fn) => {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  };

  const installStableSideRenderer = () => {
    if (typeof sides === 'undefined' || typeof sideOrder === 'undefined' || typeof selectedSides === 'undefined') return;

    const description = (side) => side.unit === 'tin' ? 'Practical serving-pan unit' : side.unit === 'recipe' ? 'Prepared from your recipe' : side.unit === 'ear' ? 'Whole ears → half-ear servings' : side.unit === 'piece' ? 'Plan pieces → buy packages' : 'Practical serving unit';

    const toggleSide = (card) => {
      const current = card.dataset.side;
      if (selectedSides.has(current)) selectedSides.delete(current); else selectedSides.add(current);
      window.renderSideCards();
      calcSides();
      save();
      window.dispatchEvent(new CustomEvent('meatfest:core-state-changed',{detail:{rolls:selectedSides.has('rolls'),cornbread:selectedSides.has('cornbread')}}));
    };

    const bindCard = (card) => {
      if (card._meatfestSideBound) return;
      card.onclick = () => toggleSide(card);
      card._meatfestSideBound = true;
    };

    const hydrateCard = (card, side) => {
      let top = card.querySelector('.sideTop');
      let text = top?.querySelector(':scope > div');
      let title = text?.querySelector('b');
      let rec = text?.querySelector('.sideRec');
      let check = top?.querySelector('.sideCheck');
      let small = card.querySelector(':scope > small');
      if (!top || !text || !title || !check || !small) return null;
      if (!rec) { rec = document.createElement('span'); rec.className = 'sideRec'; text.append(rec); }
      rec.className = 'sideRec';
      card._meatfestRefs = { title, rec, check, small };
      bindCard(card);
      return card._meatfestRefs;
    };

    const createCard = (id) => {
      const side = sides[id], card = document.createElement('div');
      card.className = 'sideCard'; card.dataset.side = id;
      const top = document.createElement('div'); top.className = 'sideTop';
      const text = document.createElement('div'), title = document.createElement('b'), rec = document.createElement('span'); rec.className = 'sideRec';
      const check = document.createElement('span'); check.className = 'sideCheck'; const small = document.createElement('small');
      title.textContent = side.name; small.textContent = description(side); text.append(title, rec); top.append(text, check); card.append(top, small);
      card._meatfestRefs = { title, rec, check, small }; bindCard(card); return card;
    };

    const updateContainer = (container, ids) => {
      if (!container) return;
      const existing = new Map([...container.querySelectorAll('[data-side]')].map(node => [node.dataset.side, node]));
      for (const id of ids) {
        const side = sides[id]; let card = existing.get(id);
        if (!card) { card = createCard(id); container.append(card); }
        const refs = card._meatfestRefs || hydrateCard(card, side);
        if (!refs) continue;
        const on = selectedSides.has(id), recommended = sideRecommendation(id);
        card.classList.toggle('on', on); card.classList.toggle('recommended', recommended);
        refs.rec.textContent = recommended ? 'RECOMMENDED' : ''; refs.rec.style.display = recommended ? '' : 'none';
        refs.check.textContent = on ? '✓' : '';
        refs.small.textContent = description(side);
      }
    };

    const renderStableSideCards = () => {
      updateContainer(document.getElementById('mainSideCards'), sideOrder.filter(id => sides[id].group === 'main' || sides[id].group === 'unit'));
      updateContainer(document.getElementById('accompSideCards'), sideOrder.filter(id => sides[id].group === 'accomp'));
    };

    window.renderSideCards = renderStableSideCards;
    renderStableSideCards();
  };

  const mount = () => {
    if (document.querySelector('meatfest-buffet')) return;
    const host = document.createElement('meatfest-buffet'), footer = document.querySelector('.footer'), wrap = document.querySelector('.wrap');
    if (footer?.parentNode) footer.parentNode.insertBefore(host, footer); else if (wrap) wrap.append(host); else document.body.append(host);
  };

  const loadApp = () => {
    if (!window.BuffetEngine) throw new Error('BuffetEngine must be loaded before buffet-app.js');
    installStableSideRenderer();
    if (customElements.get('meatfest-buffet')) { mount(); return; }
    if (document.querySelector('script[data-meatfest-buffet-app]')) return;
    const script = document.createElement('script'); script.src = APP_SRC; script.dataset.meatfestBuffetApp = 'true'; script.onload = mount; script.onerror = () => { throw new Error('Unable to load buffet-app.js'); }; document.head.appendChild(script);
  };

  ready(loadApp);
  window.addEventListener('load', installStableSideRenderer, { once: true });
})();

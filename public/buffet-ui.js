/* FSDC Meatfest — Buffet application bootstrap.
   The page owns the lifecycle: load the calculation UI after the core engine exists,
   define the custom element once, and mount one persistent host after DOM readiness.
   Side cards use the same persistent-UI rule: keyed DOM nodes are updated in place.
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

  const installStableSideRenderer = () => {
    if (typeof sides === 'undefined' || typeof sideOrder === 'undefined' || typeof selectedSides === 'undefined') return;

    const description = (side) => {
      if (side.unit === 'tin') return 'Practical serving-pan unit';
      if (side.unit === 'recipe') return 'Prepared from your recipe';
      if (side.unit === 'ear') return 'Whole ears → half-ear servings';
      if (side.unit === 'piece') return 'Plan pieces → buy packages';
      return 'Practical serving unit';
    };

    const createCard = (id) => {
      const side = sides[id];
      const card = document.createElement('div');
      card.className = 'sideCard';
      card.dataset.side = id;

      const top = document.createElement('div');
      top.className = 'sideTop';
      const text = document.createElement('div');
      const title = document.createElement('b');
      const rec = document.createElement('span');
      rec.className = 'sideRec';
      const check = document.createElement('span');
      check.className = 'sideCheck';
      const small = document.createElement('small');

      title.textContent = side.name;
      small.textContent = description(side);
      text.append(title, rec);
      top.append(text, check);
      card.append(top, small);

      card.addEventListener('click', () => {
        const current = card.dataset.side;
        if (selectedSides.has(current)) selectedSides.delete(current);
        else selectedSides.add(current);
        renderSideCards();
        calcSides();
        save();
      });
      card._meatfestRefs = { title, rec, check, small };
      return card;
    };

    const updateContainer = (container, ids) => {
      if (!container) return;
      const existing = new Map([...container.querySelectorAll('[data-side]')].map(node => [node.dataset.side, node]));
      for (const id of ids) {
        const side = sides[id];
        let card = existing.get(id);
        if (!card) {
          card = createCard(id);
          container.append(card);
        }
        const on = selectedSides.has(id);
        const recommended = sideRecommendation(id);
        card.classList.toggle('on', on);
        card.classList.toggle('recommended', recommended);
        const refs = card._meatfestRefs;
        refs.rec.textContent = recommended ? 'RECOMMENDED' : '';
        refs.rec.style.display = recommended ? '' : 'none';
        refs.check.textContent = on ? '✓' : '';
      }
    };

    const renderStableSideCards = () => {
      const main = sideOrder.filter(id => sides[id].group === 'main' || sides[id].group === 'unit');
      const accomp = sideOrder.filter(id => sides[id].group === 'accomp');
      updateContainer(document.getElementById('mainSideCards'), main);
      updateContainer(document.getElementById('accompSideCards'), accomp);
    };

    window.renderSideCards = renderStableSideCards;
    renderStableSideCards();
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
    installStableSideRenderer();
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

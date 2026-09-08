/* FSDC Meatfest — additive buffet/service-planning presentation. */
(() => {
  if (!window.BuffetEngine || typeof window.buildSummary !== 'function') return;
  const B = window.BuffetEngine;
  const state = { supplementalIds: [], dessertIds: [], breadIds: ['hawaiian'], condimentIds: ['bbqSauce','pickles','mustard'], dessertLoad: 'moderate' };
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const label = (item, fallback) => item?.name || fallback || item?.id || '';
  function ensureCard(){
    let card = document.getElementById('buffetServiceCard');
    if (card) return card;
    card = document.createElement('section');
    card.className = 'card';
    card.id = 'buffetServiceCard';
    const footer = document.querySelector('.footer');
    (footer?.parentNode || document.querySelector('.wrap')).insertBefore(card, footer || null);
    return card;
  }
  function choiceGroup(title, entries, selected, key){
    return `<div class="buffetChoiceGroup"><div class="buffetGroupTitle">${title}</div><div class="buffetChoices">${entries.map(([id,name]) => `<button type="button" class="buffetChoice ${selected.includes(id)?'on':''}" data-buffet-key="${key}" data-buffet-id="${id}"><span class="buffetCheck">${selected.includes(id)?'✓':''}</span><span>${esc(name)}</span></button>`).join('')}</div></div>`;
  }
  function formatQuantity(q){
    if (!q) return '—';
    const unit = q.unit === 'full' ? 'full tin' : q.unit === 'half' ? 'half tin' : q.unit === 'quarter' ? 'quarter tin' : q.unit;
    return `${q.amount} ${unit}${q.serviceVessels ? ` • ${q.serviceVessels} chafer${q.serviceVessels===1?'':'s'}` : ''}`;
  }
  function render(){
    const s = window.buildSummary();
    const proteinKeys = s.rows.map(r => r.key);
    const sideIds = s.sideRows.map(r => r.id);
    const p = B.plan({proteinKeys, sideIds, eaters:s.eaters, breadIds:state.breadIds, supplementalIds:state.supplementalIds, condimentIds:state.condimentIds, dessertIds:state.dessertIds, load:state.dessertLoad, tableLengths:[72,48]});
    const card = ensureCard();
    const sideRows = p.sides.map(x => `<div class="buffetRow"><span>${esc(x.side.name)}</span><b>${esc(formatQuantity(x.quantity))}</b></div>`).join('') || '<div class="note">Select sides above to build service quantities.</div>';
    const breadRows = p.breads.map(x => `<div class="buffetRow"><span>${esc(x.bread.name)}${x.functional?' <small>(functional bun)</small>':''}</span><b>${x.functional?'as needed':'general bread'}</b></div>`).join('') || '<div class="note">No bread selected.</div>';
    const condimentRows = p.condiments.map(x => `<div class="buffetRow"><span>${esc(x.item.name)}</span><b>jar / bottle</b></div>`).join('') || '<div class="note">No condiments selected.</div>';
    const sequence = p.sequence.filter(x => x.type !== 'service').map((x,i) => `<span class="buffetStep"><b>${i+1}.</b> ${esc(x.name || x.side?.name || x.bread?.name || x.item?.name || x.id)}</span>`).join('') || '<span class="note">Select a protein and sides to generate sequence.</span>';
    const mainTables = p.tables.tables.length ? p.tables.tables.map(n => `${n/12}' table`).join(' + ') : '—';
    const dessertTables = p.dessertStation.tables.tables.length ? p.dessertStation.tables.tables.map(n => `${n/12}' table`).join(' + ') : '—';
    const dessertRows = p.dessertStation.serviceGroups.map(g => `<div class="buffetRow"><span>${esc(g.items.map(x=>x.dessert?.name || x.id).join(' + '))}</span><b>${g.linearIn}" station</b></div>`).join('') || '<div class="note">No desserts selected.</div>';
    card.innerHTML = `<h2>6. Buffet &amp; Service Plan</h2><p class="note">This section plans service logistics from the selections above. It does not change the meat calculation.</p>
      ${choiceGroup('SUPPLEMENTAL GRILLING', [['burgers','Burgers'],['hotdogs','Hot Dogs'],['brats','Grilling Brats']], state.supplementalIds, 'supplementalIds')}
      ${choiceGroup('GENERAL BREAD / BAKERY', [['hawaiian','Hawaiian Rolls'],['cornbread','Cornbread']], state.breadIds, 'breadIds')}
      ${choiceGroup('CONDIMENTS', [['bbqSauce','BBQ Sauce'],['pickles','Pickles'],['pickledOnions','Pickled Onions'],['mustard','Mustard']], state.condimentIds, 'condimentIds')}
      <div class="buffetChoiceGroup"><div class="buffetGroupTitle">DESSERTS</div><div class="buffetChoices">${Object.entries(B.DESSERTS).map(([id,d]) => `<button type="button" class="buffetChoice ${state.dessertIds.includes(id)?'on':''}" data-buffet-key="dessertIds" data-buffet-id="${id}"><span class="buffetCheck">${state.dessertIds.includes(id)?'✓':''}</span><span>${esc(d.name)}</span></button>`).join('')}</div><label class="buffetLoad">Dessert load <select id="buffetDessertLoad"><option value="light" ${state.dessertLoad==='light'?'selected':''}>Light</option><option value="moderate" ${state.dessertLoad==='moderate'?'selected':''}>Moderate</option><option value="heavy" ${state.dessertLoad==='heavy'?'selected':''}>Heavy</option></select></label></div>
      <div class="buffetGrid"><div><div class="buffetGroupTitle">SIDE SERVICE QUANTITIES</div>${sideRows}</div><div><div class="buffetGroupTitle">BREAD / CONDIMENT SERVICE</div>${breadRows}${condimentRows}</div></div>
      <div class="buffetGrid"><div><div class="buffetGroupTitle">MAIN BUFFET TABLES</div><div class="buffetMetric">${esc(mainTables)}</div><div class="note">${p.tables.linearRequired}" of service frontage required • ${p.tables.linearProvided}" provided</div></div><div><div class="buffetGroupTitle">DESSERT TABLE</div><div class="buffetMetric">${esc(dessertTables)}</div>${dessertRows}</div></div>
      <div class="buffetGroupTitle">BUFFET SEQUENCE</div><div class="buffetSequence">${sequence}</div>
      <div class="purchaseNote">Supplemental grilling meats are treated as appetite competitors to the core proteins; selecting them does not add meat to the core requirement.</div>`;
    card.querySelectorAll('[data-buffet-key]').forEach(btn => btn.addEventListener('click', () => {
      const key = btn.dataset.buffetKey, id = btn.dataset.buffetId, arr = state[key];
      if (!Array.isArray(arr)) return;
      const next = arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id];
      state[key] = next;
      render();
    }));
    card.querySelector('#buffetDessertLoad')?.addEventListener('change', e => { state.dessertLoad = e.target.value; render(); });
  }
  const originalCalc = window.calc;
  window.calc = function(){
    const result = originalCalc.apply(this, arguments);
    render();
    return result;
  };
  render();
})();

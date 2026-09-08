/* FSDC Meatfest — additive buffet/service-planning presentation. */
(() => {
  if (!window.BuffetEngine || typeof window.buildSummary !== 'function') return;
  const B = window.BuffetEngine;
  const state = { supplementalIds: [], dessertIds: [], breadIds: ['hawaiian'], condimentIds: ['bbqSauce','pickles','mustard'], dessertLoad: 'moderate' };
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function ensureStyle(){
    if (document.getElementById('buffetUiStyle')) return;
    const style=document.createElement('style');style.id='buffetUiStyle';style.textContent=`
      #buffetServiceCard .buffetSection{margin:18px 0 0;padding-top:15px;border-top:1px solid #30353b}
      #buffetServiceCard .buffetSection:first-of-type{border-top:0;padding-top:0}
      #buffetServiceCard .buffetGroupTitle{font-size:10px;font-weight:900;letter-spacing:.12em;color:#c9cdd2;margin:0 0 8px}
      #buffetServiceCard .buffetChoices{display:flex;flex-wrap:wrap;gap:7px}
      #buffetServiceCard .buffetChoice{display:flex;align-items:center;gap:8px;border:1px solid #3f4346;border-radius:10px;background:#121518;color:#eee;padding:9px 11px;font:inherit;font-size:11px;font-weight:800;cursor:pointer;pointer-events:auto;user-select:none}
      #buffetServiceCard .buffetChoice:hover{border-color:#777}
      #buffetServiceCard .buffetChoice.on{border-color:#f39a32;background:#2b2116}
      #buffetServiceCard .buffetCheck{width:18px;height:18px;border:2px solid #5a6068;border-radius:5px;display:inline-flex;align-items:center;justify-content:center;font-size:12px;line-height:1;flex:0 0 auto}
      #buffetServiceCard .buffetChoice.on .buffetCheck{background:#f39a32;border-color:#f39a32;color:#151515}
      #buffetServiceCard .buffetLoad{display:flex;align-items:center;gap:8px;margin-top:9px;color:#aeb3b9;font-size:11px;font-weight:800}
      #buffetServiceCard .buffetLoad select{background:#22262b;color:#f5f2e9;border:1px solid #3a4047;border-radius:8px;padding:7px}
      #buffetServiceCard .buffetGrid{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin:0}
      #buffetServiceCard .buffetPanel{min-width:0}
      #buffetServiceCard .buffetRow{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;border-bottom:1px solid #30353b;padding:8px 0;font-size:11px;align-items:center}
      #buffetServiceCard .buffetRow:last-child{border-bottom:0}
      #buffetServiceCard .buffetRow b{font-size:11px;text-align:right;white-space:nowrap}
      #buffetServiceCard .buffetRow small{display:block;color:#aeb3b9;font-size:9px;margin-top:2px}
      #buffetServiceCard .buffetMetric{font-size:22px;font-weight:950;margin:3px 0 4px}
      #buffetServiceCard .buffetSubnote{font-size:10px;color:#aeb3b9;line-height:1.35}
      #buffetServiceCard .buffetSequence{display:flex;flex-wrap:wrap;gap:6px}
      #buffetServiceCard .buffetStep{border:1px solid #3a4047;border-radius:999px;padding:6px 8px;font-size:10px;color:#d9dde1}
      #buffetServiceCard .buffetNotice{margin-top:12px;padding:9px 10px;border-left:3px solid #f39a32;background:#1d1914;color:#d9c7ae;font-size:10px;line-height:1.4;border-radius:0 7px 7px 0}
      @media(max-width:600px){#buffetServiceCard .buffetGrid{grid-template-columns:1fr;gap:16px}}
    `;document.head.appendChild(style);
  }

  function ensureCard(){
    let card=document.getElementById('buffetServiceCard');
    if(card)return card;
    card=document.createElement('section');card.className='card';card.id='buffetServiceCard';
    const footer=document.querySelector('.footer');(footer?.parentNode||document.querySelector('.wrap')).insertBefore(card,footer||null);
    return card;
  }

  function choiceGroup(title,entries,selected,key){
    return `<div class="buffetSection"><div class="buffetGroupTitle">${title}</div><div class="buffetChoices">${entries.map(([id,name])=>`<button type="button" class="buffetChoice ${selected.includes(id)?'on':''}" aria-pressed="${selected.includes(id)}" data-buffet-key="${key}" data-buffet-id="${id}"><span class="buffetCheck">${selected.includes(id)?'✓':''}</span><span>${esc(name)}</span></button>`).join('')}</div></div>`;
  }

  function quantityText(item){
    const q=item.quantity;if(!q)return'—';
    const unit=q.unit,amount=q.amount;
    if(unit==='tin'){
      const n=Math.round(Number(amount)*4)/4,f=Math.floor(n+1e-9),r=Math.round((n-f)*4),parts=[];
      if(f)parts.push(`${f} full tin${f===1?'':'s'}`);
      if(r===1)parts.push('¼ tin');if(r===2)parts.push('½ tin');if(r===3)parts.push('¾ tin');
      return `${parts.join(' + ')||'0 tin'} • ${q.service.count} full chafer${q.service.count===1?'':'s'}`;
    }
    if(unit==='recipe')return `${amount} recipe${Number(amount)===1?'':'s'} • ${q.service.count} full chafer${q.service.count===1?'':'s'}`;
    if(unit==='ear')return `${amount} ear${Number(amount)===1?'':'s'} • ${q.service.count} full chafer${q.service.count===1?'':'s'}`;
    return `${amount} ${unit} • ${q.service.count} ${q.service.label}${q.service.count===1?'':'s'}`;
  }

  function wireChoiceButtons(card){
    card.querySelectorAll('[data-buffet-key]').forEach(btn=>{
      btn.onclick=e=>{
        e.preventDefault();
        e.stopPropagation();
        const key=btn.dataset.buffetKey,id=btn.dataset.buffetId,arr=state[key];
        if(!Array.isArray(arr))return;
        state[key]=arr.includes(id)?arr.filter(x=>x!==id):[...arr,id];
        render();
      };
    });
  }

  function render(){
    ensureStyle();
    const s=window.buildSummary(),proteinKeys=s.rows.map(r=>r.key),sideIds=s.sideRows.map(r=>r.id);
    const p=B.plan({proteinKeys,sideIds,sideRows:s.sideRows,eaters:s.eaters,breadIds:state.breadIds,supplementalIds:state.supplementalIds,condimentIds:state.condimentIds,dessertIds:state.dessertIds,load:state.dessertLoad,tableLengths:[72,48]});
    const card=ensureCard();
    const sideRows=p.sides.map(x=>`<div class="buffetRow"><span>${esc(x.side.name)}<small>${esc(x.reason)}</small></span><b>${esc(quantityText(x))}</b></div>`).join('')||'<div class="note">Select sides above to build service quantities.</div>';
    const breadRows=p.breads.map(x=>`<div class="buffetRow"><span>${esc(x.bread.name)}${x.functional?' <small>Functional bun</small>':''}</span><b>${x.functional?'as needed':'general bread'}</b></div>`).join('')||'<div class="note">No bread selected.</div>';
    const condimentRows=p.condiments.map(x=>`<div class="buffetRow"><span>${esc(x.item.name)}</span><b>jar / bottle</b></div>`).join('')||'<div class="note">No condiments selected.</div>';
    const sequence=p.sequence.filter(x=>x.type!=='service').map((x,i)=>`<span class="buffetStep"><b>${i+1}.</b> ${esc(x.name||x.side?.name||x.bread?.name||x.item?.name||x.id)}</span>`).join('')||'<span class="note">Select a protein and sides to generate sequence.</span>';
    const mainTables=p.tables.tables.length?p.tables.tables.map(n=>`${n/12}' table`).join(' + '):'—';
    const dessertTables=p.dessertStation.tables.tables.length?p.dessertStation.tables.tables.map(n=>`${n/12}' table`).join(' + '):'—';
    const dessertRows=p.dessertStation.serviceGroups.map(g=>`<div class="buffetRow"><span>${esc(g.items.map(x=>x.dessert?.name||x.id).join(' + '))}</span><b>${g.linearIn}" station</b></div>`).join('')||'<div class="note">No desserts selected.</div>';
    card.innerHTML=`<h2>6. Buffet &amp; Service Plan</h2><p class="note">This section plans service logistics from the selections above. It does not change the meat calculation.</p>
      ${choiceGroup('SUPPLEMENTAL GRILLING',[['burgers','Burgers'],['hotdogs','Hot Dogs'],['brats','Grilling Brats']],state.supplementalIds,'supplementalIds')}
      ${choiceGroup('GENERAL BREAD / BAKERY',[['hawaiian','Hawaiian Rolls'],['cornbread','Cornbread']],state.breadIds,'breadIds')}
      ${choiceGroup('CONDIMENTS',[['bbqSauce','BBQ Sauce'],['pickles','Pickles'],['pickledOnions','Pickled Onions'],['mustard','Mustard']],state.condimentIds,'condimentIds')}
      <div class="buffetSection"><div class="buffetGroupTitle">DESSERTS</div><div class="buffetChoices">${Object.entries(B.DESSERTS).map(([id,d])=>`<button type="button" class="buffetChoice ${state.dessertIds.includes(id)?'on':''}" aria-pressed="${state.dessertIds.includes(id)}" data-buffet-key="dessertIds" data-buffet-id="${id}"><span class="buffetCheck">${state.dessertIds.includes(id)?'✓':''}</span><span>${esc(d.name)}</span></button>`).join('')}</div><label class="buffetLoad">Dessert load <select id="buffetDessertLoad"><option value="light" ${state.dessertLoad==='light'?'selected':''}>Light</option><option value="moderate" ${state.dessertLoad==='moderate'?'selected':''}>Moderate</option><option value="heavy" ${state.dessertLoad==='heavy'?'selected':''}>Heavy</option></select></label></div>
      <div class="buffetSection"><div class="buffetGrid"><div class="buffetPanel"><div class="buffetGroupTitle">SIDE QUANTITIES &amp; SERVICE VESSELS</div>${sideRows}</div><div class="buffetPanel"><div class="buffetGroupTitle">BREAD / CONDIMENT SERVICE</div>${breadRows}${condimentRows}</div></div></div>
      <div class="buffetSection"><div class="buffetGrid"><div class="buffetPanel"><div class="buffetGroupTitle">MAIN BUFFET TABLES</div><div class="buffetMetric">${esc(mainTables)}</div><div class="buffetSubnote">${p.tables.linearRequired}" of service frontage required • ${p.tables.linearProvided}" provided</div></div><div class="buffetPanel"><div class="buffetGroupTitle">DESSERT TABLE</div><div class="buffetMetric">${esc(dessertTables)}</div>${dessertRows}</div></div></div>
      <div class="buffetSection"><div class="buffetGroupTitle">BUFFET SEQUENCE</div><div class="buffetSequence">${sequence}</div></div>
      <div class="buffetNotice">Supplemental grilling meats are appetite competitors to the core proteins; selecting them does not add meat to the core requirement.</div>`;
    wireChoiceButtons(card);
    card.querySelector('#buffetDessertLoad')?.addEventListener('change',e=>{state.dessertLoad=e.target.value;render()});
  }

  const originalCalc=window.calc;
  window.calc=function(){const result=originalCalc.apply(this,arguments);render();return result};
  const originalSave=window.save;
  if(typeof originalSave==='function')window.save=function(){const result=originalSave.apply(this,arguments);render();return result};
  render();
})();

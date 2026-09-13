/* FSDC Meatfest — stable accompaniment controls. The accompaniment grid is persistent; selection updates only state/classes. */
(()=>{
  if(typeof window.renderSideCards!=='function'||typeof selectedSides==='undefined')return;
  const $id=id=>document.getElementById(id);
  const mainIds=()=>sideOrder.filter(id=>sides[id].group==='main'||sides[id].group==='unit');
  const accompIds=()=>sideOrder.filter(id=>sides[id].group==='accomp');
  const unitLabel=s=>s.unit==='tin'?'Practical serving-pan unit':s.unit==='recipe'?'Prepared from your recipe':s.unit==='ear'?'Whole ears → half-ear servings':s.unit==='piece'?'Plan pieces → buy packages':'Practical serving unit';
  const card=id=>{const s=sides[id];return `<div class="sideCard" data-side="${id}"><div class="sideTop"><div><b>${s.name}</b><span class="sideRec" data-rec hidden>RECOMMENDED</span></div><span class="sideCheck"></span></div><small>${unitLabel(s)}</small></div>`};
  const sync=()=>{
    document.querySelectorAll('[data-side]').forEach(el=>{const id=el.dataset.side,on=selectedSides.has(id),rec=sideRecommendation(id);el.classList.toggle('on',on);el.classList.toggle('recommended',rec);el.setAttribute('aria-pressed',String(on));const badge=el.querySelector('[data-rec]');if(badge)badge.hidden=!rec});
    window.__meatfestSyncBuffetBread?.();
  };
  const handle=e=>{const el=e.target.closest('.sideCard');if(!el||!e.currentTarget.contains(el))return;e.preventDefault();e.stopPropagation();const id=el.dataset.side;if(selectedSides.has(id))selectedSides.delete(id);else selectedSides.add(id);sync();calcSides();save()};
  const main=$id('mainSideCards'),accomp=$id('accompSideCards');
  if(!main||!accomp)return;
  main.innerHTML=mainIds().map(card).join('');
  accomp.innerHTML=accompIds().map(card).join('');
  main.addEventListener('click',handle);accomp.addEventListener('click',handle);
  window.renderSideCards=()=>sync();
  sync();
})();

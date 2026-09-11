/* FSDC Meatfest — canonical buffet visual and print renderer. */
(() => {
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  let observer=null;

  function tableData(card){
    return [...card.querySelectorAll('.layoutTable')].slice(0,4).map((table,i)=>{
      const title=table.querySelector('.layoutTableTitle')?.textContent?.trim()||`Table ${i+1}`;
      const length=table.querySelector('.layoutTableTitle span:last-child')?.textContent?.trim()||'';
      const items=[...table.querySelectorAll('.layoutItem')].map(x=>x.textContent.trim()).filter(Boolean);
      const station=table.querySelector('.layoutStation')?.textContent?.trim()||'Transition';
      const fill=table.querySelector('.layoutFill')?.style.width||'0%';
      const usedMatch=table.querySelector('.layoutBar')?.nextElementSibling?.textContent||'';
      return {title,length,items,station,fill,usedMatch};
    });
  }

  function baseTableVisual(card,tables){
    if(!tables.length)return;
    const visual=document.createElement('div');
    visual.className='visualLayout mf-visual';
    visual.innerHTML=`<div class="mf-head"><div><b>MAIN BUFFET — U-SHAPE</b><span>Physical service-vessel allocation and guest flow</span></div><div class="mf-meta">STANDARD: 3 × 6' + 1 × 4' • 66 sq ft</div></div><div class="mf-map">${tables.map((t,i)=>`<div class="mf-table mf-t${i+1}"><b>${esc(t.title)}</b><small>${esc(t.length)} • ${esc(t.station)}</small><div>${t.items.slice(0,8).map(n=>`<em>${esc(n)}</em>`).join('')}</div></div>`).join('')}<div class="mf-open">GUEST APPROACH</div></div>`;
    card.insertBefore(visual,card.querySelector('.layoutTables')||card.firstChild);
  }

  function render(){
    const card=document.getElementById('buffetLayoutCard');
    if(!card)return;
    if(observer)observer.disconnect();
    card.querySelectorAll('.mf-visual,.mf-recommended').forEach(x=>x.remove());
    baseTableVisual(card,tableData(card));
    if(observer)observer.observe(card,{childList:true,subtree:true});
  }

  function renderPrintAllocation(){
    const box=document.getElementById('psBuffet'),card=document.getElementById('buffetLayoutCard');
    if(!box||!card)return;
    const tables=tableData(card);
    if(!tables.length)return;
    box.innerHTML=`<div><b>BUFFET LAYOUT &amp; SERVICE FLOW</b><small>Main footprint: 3 × 6' + 1 × 4' • 66 sq ft • dessert separate</small></div><div class="ps-layout-tables">${tables.map((t,i)=>`<div class="ps-bTable"><strong>${esc(t.title)} • ${esc(t.length)}</strong><span>${esc(t.station)}${i===3?' • END':''}</span><p>${t.items.join(' • ')||'Service space'}</p></div>`).join('')}</div>`;
  }

  function wrapPrint(){
    if(typeof window.populatePrint!=='function'||window.populatePrint.__mfWrapped)return;
    const original=window.populatePrint;
    const wrapped=function(){original.apply(this,arguments);requestAnimationFrame(renderPrintAllocation)};
    wrapped.__mfWrapped=true;
    window.populatePrint=wrapped;
  }

  function installStyle(){
    if(!document.createElement||!document.head||document.getElementById('mf-layout-style'))return;
    const s=document.createElement('style');
    s.id='mf-layout-style';
    s.textContent=`#buffetLayoutCard .mf-visual{margin-top:14px;padding:14px;border:1px solid #30353b;border-radius:14px;background:#101214}#buffetLayoutCard .mf-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-end;margin-bottom:12px}.mf-head b{display:block;font-size:11px;letter-spacing:.11em}.mf-head span{display:block;color:#9da3aa;font-size:9px;line-height:1.35;margin-top:3px}.mf-meta{text-align:right;color:#aeb3b9;font-size:9px;line-height:1.35}#buffetLayoutCard .mf-map{display:grid;grid-template-columns:1fr 1.4fr 1fr;grid-template-rows:82px 82px 34px;gap:7px}.mf-table{border:2px solid #575d64;border-radius:9px;background:#20242a;padding:7px;overflow:hidden;min-width:0}.mf-table b{font-size:9px}.mf-table small{display:block;color:#9da3aa;font-size:7px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mf-table>div{display:flex;flex-wrap:wrap;gap:2px;margin-top:4px}.mf-table em{font-style:normal;font-size:6.5px;border:1px solid #3a4047;border-radius:99px;padding:2px 3px;color:#d8dce0}.mf-t1{grid-column:1;grid-row:1 / span 2}.mf-t2{grid-column:2;grid-row:1}.mf-t3{grid-column:3;grid-row:1 / span 2}.mf-t4{grid-column:2;grid-row:2}.mf-open{grid-column:1 / span 3;display:flex;justify-content:center;align-items:center;color:#666d75;font-size:7px;letter-spacing:.1em;text-transform:uppercase}@media(max-width:650px){#buffetLayoutCard .mf-map{grid-template-columns:1fr 1.2fr 1fr}}`;
    document.head.appendChild(s);
  }

  function start(){
    if(!document.createElement)return;
    installStyle();
    const card=document.getElementById('buffetLayoutCard');
    if(!card){setTimeout(start,50);return;}
    observer=new MutationObserver(()=>requestAnimationFrame(render));
    render();
    wrapPrint();
  }

  start();
})();

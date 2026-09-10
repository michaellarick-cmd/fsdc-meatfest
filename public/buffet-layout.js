/* FSDC Meatfest — visual buffet layout presentation. Calculation remains in BuffetEngine. */
(() => {
  const STYLE_ID = 'buffetLayoutVisualStyle';
  const esc = v => String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  function style(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement('style'); s.id=STYLE_ID;
    s.textContent=`
      #buffetLayoutCard .visualLayout{margin-top:14px;border:1px solid #30353b;border-radius:14px;background:#101214;padding:14px}
      #buffetLayoutCard .visualLayoutHead{display:flex;justify-content:space-between;gap:12px;align-items:flex-end;margin-bottom:12px}
      #buffetLayoutCard .visualLayoutTitle{font-size:11px;font-weight:900;letter-spacing:.12em;color:#c9cdd2}
      #buffetLayoutCard .visualLayoutMeta{font-size:10px;color:#aeb3b9;text-align:right}
      #buffetLayoutCard .uMap{display:grid;grid-template-columns:74px 1fr 74px;grid-template-rows:92px 92px 58px;gap:8px;align-items:stretch}
      #buffetLayoutCard .uTable{border:2px solid #575d64;border-radius:9px;background:#20242a;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:7px;text-align:center;min-width:0;overflow:hidden}
      #buffetLayoutCard .uTable b{font-size:11px}.uTable small{font-size:8px;color:#aeb3b9;margin-top:3px;line-height:1.25}
      #buffetLayoutCard .uTable.t1{grid-column:1;grid-row:1 / span 2}.uTable.t2{grid-column:2;grid-row:1}.uTable.t3{grid-column:3;grid-row:1 / span 2}.uTable.t4{grid-column:2;grid-row:2 / span 2}
      #buffetLayoutCard .uOpen{grid-column:1;grid-row:3;display:flex;align-items:center;justify-content:center;color:#626971;font-size:8px;text-transform:uppercase;letter-spacing:.08em}
      #buffetLayoutCard .uEntry{grid-column:3;grid-row:3;display:flex;align-items:center;justify-content:center;color:#626971;font-size:8px;text-transform:uppercase;letter-spacing:.08em}
      #buffetLayoutCard .uItems{display:flex;flex-wrap:wrap;justify-content:center;gap:3px;margin-top:5px}.uItem{font-size:7px;color:#d9dde1;border:1px solid #3a4047;border-radius:999px;padding:3px 4px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      #buffetLayoutCard .visualLegend{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.visualLegend span{font-size:8px;color:#aeb3b9;border:1px solid #30353b;border-radius:999px;padding:4px 6px}
      #buffetLayoutCard .flowStrip{display:flex;gap:5px;overflow:auto;margin-top:12px;padding-bottom:2px}.flowStrip span{flex:0 0 auto;border:1px solid #3a4047;border-radius:999px;padding:5px 7px;font-size:8px;color:#d9dde1}
      @media(max-width:600px){#buffetLayoutCard .uMap{grid-template-columns:58px 1fr 58px;grid-template-rows:82px 82px 52px}.uItem{font-size:6px;padding:2px 3px}.visualLayout{padding:10px!important}}
    `; document.head.appendChild(s);
  }
  function itemsFromTable(table){
    return [...table.querySelectorAll('.layoutItem')].map(x=>x.textContent.trim()).filter(Boolean);
  }
  function render(){
    const card=document.getElementById('buffetLayoutCard');
    if(!card) return;
    style();
    const old=card.querySelector('.visualLayout'); if(old) old.remove();
    const tables=[...card.querySelectorAll('.layoutTable')];
    if(!tables.length) return;
    const data=tables.map((t,i)=>({length:(t.querySelector('.layoutTableTitle span:last-child')?.textContent||'').trim(),items:itemsFromTable(t),station:(t.querySelector('.layoutStation')?.textContent||'').trim(),overflow:t.classList.contains('layoutOverflow')}));
    const order=[data[0],data[1],data[2],data[3]].filter(Boolean);
    const table=(d,cls)=>d?`<div class="uTable ${cls} ${d.overflow?'layoutOverflow':''}"><b>Table ${order.indexOf(d)+1} • ${esc(d.length)}</b><small>${esc(d.station||'Service space')}</small><div class="uItems">${d.items.slice(0,8).map(x=>`<span class="uItem">${esc(x)}</span>`).join('')}</div></div>`:'';
    const flow=[...card.querySelectorAll('.buffetRow')].map(r=>r.querySelector('span')?.textContent?.trim()).filter(Boolean);
    const v=document.createElement('div'); v.className='visualLayout';
    v.innerHTML=`<div class="visualLayoutHead"><div><div class="visualLayoutTitle">MAIN BUFFET — U-SHAPE</div><div class="note">Guests move left-to-right through the meal, with the center/right side reserved for the core BBQ proteins.</div></div><div class="visualLayoutMeta">3 × 6' + 1 × 4'<br>66 sq ft main surface</div></div><div class="uMap">${table(order[0],'t1')}${table(order[1],'t2')}${table(order[2],'t3')}${table(order[3],'t4')}<div class="uOpen">guest approach</div><div class="uEntry">entry / exit</div></div><div class="visualLegend"><span>LEFT: cold + fresh</span><span>CENTER: vegetables + starches</span><span>RIGHT: BBQ proteins</span><span>END: bread + sauces</span></div>${flow.length?`<div class="flowStrip">${flow.slice(0,12).map((x,i)=>`<span>${i+1}. ${esc(x)}</span>`).join('')}</div>`:''}</div>`;
    card.insertBefore(v,card.firstChild?.nextSibling||null);
  }
  let queued=false;
  const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;render()})};
  const obs=new MutationObserver(schedule);
  function start(){const card=document.getElementById('buffetLayoutCard');if(!card){setTimeout(start,100);return}obs.observe(card,{childList:true,subtree:true});render()}
  start();
})();

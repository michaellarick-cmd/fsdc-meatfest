/* FSDC Meatfest — Buffet application. One state owner, one calculation pipeline, one renderer. */
(() => {
  const STORAGE_KEY='mfBuffet18';
  const WORKER_URL='/buffet-worker.js?v=5';
  const BREAD_TO_SIDE=Object.freeze({hawaiian:'rolls',cornbread:'cornbread'});
  const SIDE_ROWS=Object.freeze(['asparagus','beans','broccoli','cauli','slaw','collards','corn','cucumber','greenbeans','mac','pastasalad','potatosalad','kraut','hawaiian','cornbread']);
  const SUPPLEMENTAL=Object.freeze([['burgers','Burgers'],['hotdogs','Hot Dogs'],['brats','Grilling Brats']]);
  const BREAD=Object.freeze([['hawaiian','Hawaiian Rolls'],['cornbread','Cornbread']]);
  const SAUSAGE=Object.freeze(Object.entries(window.BuffetEngine.SAUSAGE_MODES||{}));
  const CONDIMENTS=Object.freeze([['bbqSauce','BBQ Sauce'],['pickles','Pickles'],['pickledOnions','Pickled Onions'],['mustard','Mustard']]);
  const DESSERTS=Object.freeze(Object.entries(window.BuffetEngine.DESSERTS||{}));

  const readState=()=>{
    const defaults={supplementalIds:[],breadIds:[],condimentIds:[],dessertIds:[],dessertLoad:'moderate',sausageMode:'polish'};
    try{
      const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
      const next={...defaults,...saved};
      for(const key of ['supplementalIds','breadIds','condimentIds','dessertIds'])if(!Array.isArray(next[key]))next[key]=[];
      if(!['light','moderate','heavy'].includes(next.dessertLoad))next.dessertLoad='moderate';
      if(!window.BuffetEngine.SAUSAGE_MODES?.[next.sausageMode])next.sausageMode='polish';
      return next;
    }catch{return defaults}
  };

  const coreBreadIds=()=>{
    const ids=[];
    if(typeof selectedSides!=='undefined'){
      if(selectedSides.has('rolls'))ids.push('hawaiian');
      if(selectedSides.has('cornbread'))ids.push('cornbread');
    }
    return ids;
  };

  const setCoreBread=(id,on)=>{
    if(typeof selectedSides==='undefined')return;
    const sideId=BREAD_TO_SIDE[id];if(!sideId)return;
    if(on)selectedSides.add(sideId);else selectedSides.delete(sideId);
    window.renderSideCards?.();window.calcSides?.();window.save?.();
  };

  const el=(tag,props={},children=[])=>{
    const node=document.createElement(tag);
    for(const [key,value] of Object.entries(props)){
      if(key==='text')node.textContent=value;
      else if(key==='class')node.className=value;
      else if(key==='dataset')Object.assign(node.dataset,value);
      else node.setAttribute(key,value);
    }
    for(const child of children)node.append(child);
    return node;
  };

  class MeatfestBuffet extends HTMLElement{
    constructor(){
      super();
      this.attachShadow({mode:'open'});
      this.state=readState();this.state.breadIds=coreBreadIds();
      this.worker=null;this.busy=false;this.pending=null;this.revision=0;this.appliedRevision=0;this.refs={};this.planStarted=false;
      this._coreStateChanged=()=>{
        this.state.breadIds=coreBreadIds();
        this.syncControls();
        if(this.planStarted)this.requestPlan();
      };
    }

    connectedCallback(){
      if(this.initialized)return;
      this.initialized=true;
      window.addEventListener('meatfest:core-state-changed',this._coreStateChanged);
      this.shadowRoot.append(this.styles(),this.shell());
      this.bind();
      this.syncControls();
      // Do not gate the first calculation on viewport visibility. The Buffet is
      // part of the page's persistent layout, and lazy visibility scheduling can
      // race with scrolling and make the service/layout regions appear blank.
      // Calculate immediately; subsequent calculations remain state-change driven.
      this.planStarted=true;
      this.requestPlan();
    }

    disconnectedCallback(){window.removeEventListener('meatfest:core-state-changed',this._coreStateChanged);this.worker?.terminate();this.worker=null;}

    styles(){return el('style',{text:`
      :host{display:block;margin:11px 0;color:var(--text,#f5f2e9);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      *{box-sizing:border-box}.card{background:linear-gradient(145deg,#1b1e22,#15181b);border:1px solid #30353b;border-radius:20px;padding:17px;margin:11px 0;box-shadow:0 12px 30px #0004}
      h2{font-size:17px;margin:0 0 13px}.note{font-size:11px;color:#aeb3b9;line-height:1.45;margin:0 0 8px}.section{margin-top:16px;padding-top:13px;border-top:1px solid #30353b}.title{font-size:10px;font-weight:900;letter-spacing:.12em;color:#c9cdd2;margin-bottom:8px}.desc{font-size:10px;color:#aeb3b9;line-height:1.35;margin-bottom:7px}
      .choice{border:1px solid #3f4346;border-radius:10px;background:#121518;color:#eee;padding:9px 11px;font:inherit;font-size:11px;font-weight:800;margin:0 7px 7px 0;cursor:pointer}.choice.on{border-color:#f39a32;background:#2b2116}.check{display:inline-flex;width:17px;height:17px;border:2px solid #5a6068;border-radius:5px;align-items:center;justify-content:center;margin-right:6px}.choice.on .check{background:#f39a32;border-color:#f39a32;color:#151515}
      .load{display:block;color:#aeb3b9;font-size:10px;margin-top:6px}.load select{margin-left:5px;background:#22262b;border:1px solid #3a4047;color:#f5f2e9;border-radius:8px;padding:6px}.row{display:grid;grid-template-columns:1fr auto;gap:10px;border-bottom:1px solid #30353b;padding:8px 0;font-size:11px;min-height:34px}.row small{display:block;color:#aeb3b9;font-size:9px;margin-top:2px}.qty{white-space:nowrap}
      .table{background:#121518;border:1px solid #30353b;border-radius:10px;padding:10px;margin:8px 0;min-height:64px}.bar{height:7px;background:#2a2e33;border-radius:99px;overflow:hidden;margin:7px 0}.fill{height:100%;background:#f39a32;width:0}.items{font-size:9px;color:#d9dde1;line-height:1.45;min-height:13px}.overflow,.dessertSummary{font-size:10px;color:#aeb3b9;line-height:1.35;margin-top:8px;min-height:13px}@media(max-width:600px){.choice{max-width:100%}}
    `});}

    shell(){
      const serviceCard=el('section',{class:'card',id:'buffetServiceCard'});serviceCard.append(el('h2',{text:'6. Buffet & Service Plan'}),el('p',{class:'note',text:'Service logistics are calculated from the selections above. The locked meat buy/yield model is not changed.'}));
      const grill=this.makeSection(serviceCard,'supplemental','SUPPLEMENTAL GRILLING'),bread=this.makeSection(serviceCard,'bread','GENERAL BREAD / BAKERY'),sausage=this.makeSection(serviceCard,'sausage','SAUSAGE SERVICE'),condiment=this.makeSection(serviceCard,'condiments','CONDIMENTS'),dessert=this.makeSection(serviceCard,'desserts','DESSERTS'),service=this.makeSection(serviceCard,'service','SERVICE QUANTITIES','Calculated from the current Meatfest plan and Buffet selections.');
      this.refs.grill=grill;this.refs.bread=bread;this.refs.sausage=sausage;this.refs.condiment=condiment;this.refs.dessert=dessert;this.refs.service=service;
      const rows=new Map();for(const id of SIDE_ROWS){const row=el('div',{class:'row',dataset:{row:id}}),name=el('div'),title=el('b'),note=el('small'),qty=el('b',{class:'qty'});name.append(title,note);row.append(name,qty);service.append(row);rows.set(id,{row,name:title,note,qty})}this.refs.rows=rows;
      this.refs.dessertSummary=el('div',{class:'dessertSummary',text:'Calculating service quantities…'});dessert.append(this.refs.dessertSummary);
      const load=el('label',{class:'load',text:'Dessert load '});this.refs.load=el('select',{id:'mfDessertLoad'});for(const value of ['light','moderate','heavy'])this.refs.load.append(el('option',{value,text:value[0].toUpperCase()+value.slice(1)}));load.append(this.refs.load);dessert.append(load);
      const layoutCard=el('section',{class:'card',id:'buffetLayoutCard'});layoutCard.append(el('h2',{text:'7. Buffet Table Layout'}),el('p',{class:'note',text:'Canonical Meatfest geometry: a U-shaped main buffet using three 6\' tables plus one 4\' table. Dessert remains a separate 4\' station.'}));
      const layout=this.makeSection(layoutCard,'layout','TABLE-BY-TABLE SETUP'),tableRefs=[];for(let i=1;i<=8;i++){const table=el('div',{class:'table',dataset:{table:String(i)}}),head=el('b',{text:`Table ${i} — calculating…`}),bar=el('div',{class:'bar'}),fill=el('div',{class:'fill'}),items=el('div',{class:'items',text:'Calculating…'});bar.append(fill);table.append(head,bar,items);layout.append(table);tableRefs.push({table,head,fill,items})}const overflow=el('div',{class:'overflow',text:'Calculating overflow…'});layoutCard.append(overflow);this.refs.layout={section:layout,rows:tableRefs,overflow};
      const fragment=document.createDocumentFragment();fragment.append(serviceCard,layoutCard);return fragment;
    }

    makeSection(parent,id,title,desc=''){const section=el('section',{class:'section',id:`buffet${id[0].toUpperCase()+id.slice(1)}`});section.dataset.mfSection=id;section.append(el('div',{class:'title',text:title}));if(desc)section.append(el('div',{class:'desc',text:desc}));parent.append(section);return section}
    addChoice(section,id,label,kind){const button=el('button',{type:'button',class:'choice',dataset:{kind,id,k:kind}});button.setAttribute('aria-pressed','false');button.append(el('span',{class:'check'}),el('span',{text:label}));section.append(button);return button}

    bind(){
      const choiceSets=[['supplemental',SUPPLEMENTAL,this.refs.grill],['bread',BREAD,this.refs.bread],['sausage',SAUSAGE.map(([id,mode])=>[id,mode.label]),this.refs.sausage],['condiment',CONDIMENTS,this.refs.condiment],['dessert',DESSERTS.map(([id,dessert])=>[id,dessert.name]),this.refs.dessert]];
      for(const [kind,items,section] of choiceSets)for(const [id,label] of items)this.addChoice(section,id,label,kind);
      this.refs.load.value=this.state.dessertLoad;this.refs.load.addEventListener('change',event=>{this.state.dessertLoad=event.target.value;this.persist();if(this.planStarted)this.requestPlan()});
      this.shadowRoot.addEventListener('click',event=>{const button=event.target.closest?.('button[data-kind]');if(!button)return;const{kind,id}=button.dataset;if(kind==='bread'){setCoreBread(id,!this.state.breadIds.includes(id));this.state.breadIds=coreBreadIds()}else if(kind==='sausage')this.state.sausageMode=id;else{const key=kind==='supplemental'?'supplementalIds':kind==='condiment'?'condimentIds':'dessertIds';this.state[key]=this.toggle(this.state[key],id)}this.persist();this.syncControls();if(this.planStarted)this.requestPlan()});
    }

    toggle(list,id){return list.includes(id)?list.filter(value=>value!==id):[...list,id]}
    persist(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(this.state))}catch{}}
    syncControls(){this.refs.load.value=this.state.dessertLoad;this.shadowRoot.querySelectorAll('button[data-kind]').forEach(button=>{const{kind,id}=button.dataset;let on=false;if(kind==='bread')on=this.state.breadIds.includes(id);else if(kind==='sausage')on=this.state.sausageMode===id;else{const key=kind==='supplemental'?'supplementalIds':kind==='condiment'?'condimentIds':'dessertIds';on=this.state[key].includes(id)}button.classList.toggle('on',on);button.setAttribute('aria-pressed',String(on));button.querySelector('.check').textContent=on?'✓':''})}
    input(){const summary=window.buildSummary();this.state.breadIds=coreBreadIds();return{proteinKeys:(summary.rows||[]).map(row=>row.key),sideIds:(summary.sideRows||[]).map(row=>row.id),sideRows:summary.sideRows||[],eaters:summary.eaters,breadIds:[...this.state.breadIds],supplementalIds:[...this.state.supplementalIds],condimentIds:[...this.state.condimentIds],dessertIds:[...this.state.dessertIds],load:this.state.dessertLoad,sausageMode:this.state.sausageMode}}
    requestPlan(){this.pending={revision:++this.revision,input:this.input()};if(!this.busy)this.dispatchPending()}
    dispatchPending(){if(!this.pending)return;if(!this.worker){this.worker=new Worker(WORKER_URL);this.worker.onmessage=event=>this.receive(event.data||{});this.worker.onerror=event=>this.fail(`Buffet calculation failed: ${event.message||'worker error'}`)}const request=this.pending;this.pending=null;this.busy=true;this.worker.postMessage(request)}
    receive(message){this.busy=false;if(message.error){this.fail(message.error);return}if(message.revision>=this.appliedRevision){this.appliedRevision=message.revision;this.renderResult(message.result)}if(this.pending)this.dispatchPending()}
    fail(message){this.refs.service.dataset.error=message;this.refs.dessertSummary.textContent='Calculation unavailable.';this.busy=false;if(this.pending)this.dispatchPending()}
    renderResult(result){const map=new Map((result?.serviceRows||[]).map(row=>[row.id,row]));for(const [id,ref] of this.refs.rows){const row=map.get(id);ref.name.textContent=row?.name||id;ref.note.textContent=row?.note||'Not selected';ref.qty.textContent=row?.qty||'—'}this.refs.dessertSummary.textContent=result?.dessertSummary||'No desserts selected.';const tables=result?.tables||[];this.refs.layout.rows.forEach((ref,index)=>{const table=tables[index];if(!table){ref.head.textContent=`Table ${index+1} — no assigned items`;ref.fill.style.width='0%';ref.items.textContent='No assigned items';return}const length=Number(table.length)||72,used=Number(table.used)||0;ref.head.textContent=`Table ${table.table} — ${length}\"`;ref.fill.style.width=`${Math.min(100,Math.round(used/length*100))}%`;ref.items.textContent=(table.items||[]).join(' • ')||'No assigned items'});this.refs.layout.overflow.textContent=(result?.overflowItems||[]).length?`Overflow / next service space: ${result.overflowItems.join(' • ')}`:'No overflow'}
  }

  if(!customElements.get('meatfest-buffet'))customElements.define('meatfest-buffet',MeatfestBuffet);
  window.MeatfestBuffet=Object.freeze({version:5});
})();

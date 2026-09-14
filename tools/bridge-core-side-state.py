from pathlib import Path

p=Path('public/buffet-ui.js'); s=p.read_text(encoding='utf-8')
needle="window.renderSideCards();\n      calcSides();\n      save();"
replacement=needle+"\n      window.dispatchEvent(new CustomEvent('meatfest:core-state-changed'));"
if s.count(needle)!=1: raise SystemExit(f'expected one stable side toggle, found {s.count(needle)}')
s=s.replace(needle,replacement,1)
p.write_text(s,encoding='utf-8')

p=Path('public/buffet-app.js'); s=p.read_text(encoding='utf-8')
needle="this.worker=null;this.busy=false;this.pending=null;this.revision=0;this.appliedRevision=0;this.refs={};this.visibilityObserver=null;this.planStarted=false;"
replacement=needle+"this._coreStateChanged=()=>{this.state.breadIds=coreBreadIds();this.syncControls();if(this.planStarted)this.requestPlan()};"
if needle not in s: raise SystemExit('buffet-app constructor insertion point missing')
s=s.replace(needle,replacement,1)
needle2="this.initialized=true;\n      this.shadowRoot.append"
replacement2="this.initialized=true;\n      window.addEventListener('meatfest:core-state-changed',this._coreStateChanged);\n      this.shadowRoot.append"
if needle2 not in s: raise SystemExit('buffet-app connected insertion point missing')
s=s.replace(needle2,replacement2,1)
needle3="disconnectedCallback(){this.visibilityObserver?.disconnect();this.visibilityObserver=null;this.worker?.terminate();this.worker=null;}"
replacement3="disconnectedCallback(){window.removeEventListener('meatfest:core-state-changed',this._coreStateChanged);this.visibilityObserver?.disconnect();this.visibilityObserver=null;this.worker?.terminate();this.worker=null;}"
if needle3 not in s: raise SystemExit('buffet-app disconnect insertion point missing')
s=s.replace(needle3,replacement3,1)
p.write_text(s,encoding='utf-8')

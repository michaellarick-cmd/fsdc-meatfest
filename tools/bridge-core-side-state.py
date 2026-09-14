from pathlib import Path

p=Path('public/buffet-ui.js'); s=p.read_text(encoding='utf-8')
needle="window.renderSideCards = renderStableSideCards;"
replacement=needle+"\nwindow.addEventListener('meatfest:core-state-changed',()=>renderStableSideCards());"
if "meatfest:core-state-changed" not in s:
    if needle not in s: raise SystemExit('buffet-ui owner insertion point missing')
    s=s.replace(needle,replacement,1)
needle2="window.renderSideCards?.();window.calcSides?.();window.save?.();"
replacement2=needle2+"window.dispatchEvent(new CustomEvent('meatfest:core-state-changed'));"
if s.count(needle2)!=1: raise SystemExit(f'expected one bread core bridge, found {s.count(needle2)}')
# no change to buffet-ui toggle here; its existing toggle is patched below
s=s.replace(needle2,replacement2,1)
p.write_text(s,encoding='utf-8')

p=Path('public/buffet-ui.js'); s=p.read_text(encoding='utf-8')
needle3="window.calcSides();window.save();"
if needle3 in s and "window.dispatchEvent(new CustomEvent('meatfest:core-state-changed'));" not in s.split(needle3)[0][-500:]:
    s=s.replace(needle3,needle3+"window.dispatchEvent(new CustomEvent('meatfest:core-state-changed'));",1)
else:
    # stable owner may use optional chaining in current source
    needle4="window.calcSides?.();window.save?.();"
    if s.count(needle4)!=1: raise SystemExit('stable side toggle bridge insertion point missing')
    if "meatfest:core-state-changed" not in s.split(needle4)[0][-500:]:
        s=s.replace(needle4,needle4+"window.dispatchEvent(new CustomEvent('meatfest:core-state-changed'));",1)
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

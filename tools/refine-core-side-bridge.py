from pathlib import Path

p=Path('public/buffet-ui.js'); s=p.read_text(encoding='utf-8')
old="window.dispatchEvent(new CustomEvent('meatfest:core-state-changed'));"
new="window.dispatchEvent(new CustomEvent('meatfest:core-state-changed',{detail:{rolls:selectedSides.has('rolls'),cornbread:selectedSides.has('cornbread')}}));"
if s.count(old)!=1: raise SystemExit(f'expected one core-side event, found {s.count(old)}')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')

p=Path('public/buffet-app.js'); s=p.read_text(encoding='utf-8')
old="this._coreStateChanged=()=>{this.state.breadIds=coreBreadIds();this.syncControls();if(this.planStarted)this.requestPlan()};"
new="this._coreStateChanged=(event)=>{const detail=event?.detail||{};this.setCoreBread('hawaiian',!!detail.rolls);this.setCoreBread('cornbread',!!detail.cornbread);this.syncControls();if(this.planStarted)this.requestPlan()};"
if s.count(old)!=1: raise SystemExit(f'expected one bridge handler, found {s.count(old)}')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')

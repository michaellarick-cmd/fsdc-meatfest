from pathlib import Path
import re

app = Path('public/app.js')
s = app.read_text(encoding='utf-8')
pattern = r'function renderSideCards\(\)\{.*?\}\nfunction calcSides'
new, count = re.subn(pattern, 'function calcSides', s, count=1, flags=re.S)
if count != 1:
    raise SystemExit(f'expected exactly one duplicate renderSideCards function, found {count}')
new = new.replace('renderSideCards();', 'window.renderSideCards?.();')
if 'function renderSideCards' in new or 'mainSideCards").innerHTML' in new or 'accompSideCards").innerHTML' in new:
    raise SystemExit('duplicate side-card renderer still present')
app.write_text(new, encoding='utf-8')

test = Path('test/buffet-ui-architecture.test.js')
t = test.read_text(encoding='utf-8')
needle = "const app=await readFile(new URL('../public/buffet-app.js',import.meta.url),'utf8');"
replacement = needle + "\nconst core=await readFile(new URL('../public/app.js',import.meta.url),'utf8');"
if needle not in t:
    raise SystemExit('architecture test insertion point not found')
t = t.replace(needle, replacement, 1)
needle2 = "assert.doesNotMatch(app,/\\.innerHTML\\s*=/);"
replacement2 = needle2 + "assert.doesNotMatch(core,/function renderSideCards\\s*\\(/);assert.doesNotMatch(core,/mainSideCards\\\"\\)\\.innerHTML|accompSideCards\\\"\\)\\.innerHTML/);assert.doesNotMatch(core,/querySelectorAll\\(\\\"\\[data-side\\]\\\"/);"
if needle2 not in t:
    raise SystemExit('architecture test assertion point not found')
t = t.replace(needle2, replacement2, 1)
test.write_text(t, encoding='utf-8')

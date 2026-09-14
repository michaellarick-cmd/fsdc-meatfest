from pathlib import Path
p=Path('public/meatfest-final.js')
s=p.read_text(encoding='utf-8')
count=s.count('renderSideCards();')
if count != 1:
    raise SystemExit(f'expected exactly one meatfest-final side render call, found {count}')
s=s.replace('renderSideCards();','window.renderSideCards?.();')
p.write_text(s,encoding='utf-8')

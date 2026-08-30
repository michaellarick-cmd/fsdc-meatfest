from pathlib import Path

def once(path, old, new):
    p=Path(path); s=p.read_text(); n=s.count(old)
    if n != 1: raise SystemExit(f'{path}: expected 1 match, found {n}')
    p.write_text(s.replace(old,new,1))

# Production app: move all runtime-injected features into committed source.
app='public/app.js'; s=Path(app).read_text()
if 'meats.turkey=' not in s:
    once(app,'\n};\n\n/*\n * Current recommendation engine','''\n};\nmeats.turkey={name:"Turkey",default:"whole",options:{\n  whole:{label:"Whole Turkey",yield:.55,unitWeight:14,unit:"whole turkey",mode:"units"},\n  breast:{label:"Turkey Breast",yield:.65,unitWeight:7,unit:"turkey breast",mode:"units"},\n  legs:{label:"Turkey Legs",yield:.45,unitWeight:.75,unit:"turkey leg",mode:"units"}\n}};\n\n/*\n * Current recommendation engine''')
s=Path(app).read_text()
if 'greenbeans:{name:"Green Beans"' not in s:
    anchor=' rolls:{name:"Hawaiian Rolls",group:"accomp",unit:"piece",base:16,min:8,sensitivity:.10,round:8,fill:"piece",packagePieces:32,note:"Sandwich vehicle for pulled pork, pulled chicken and sliced brisket. Costco twin pack is 32 rolls."}\n};'
    repl=''' rolls:{name:"Hawaiian Rolls",group:"accomp",unit:"piece",base:16,min:8,sensitivity:.10,round:8,fill:"piece",packagePieces:32,note:"Sandwich vehicle for pulled pork, pulled chicken and sliced brisket. Costco twin pack is 32 rolls."},\n greenbeans:{name:"Green Beans",group:"main",unit:"recipe",base:1.0,min:0.5,sensitivity:.70,round:.25,fill:"recipe",note:"Grilled or smoked BBQ vegetable side."},\n potatosalad:{name:"Potato Salad",group:"main",unit:"recipe",base:1.5,min:0.5,sensitivity:.55,round:.5,fill:"recipe",note:"Classic BBQ side."},\n asparagus:{name:"Asparagus",group:"main",unit:"recipe",base:1.0,min:0.5,sensitivity:.70,round:.25,fill:"recipe",note:"Grilled or smoked BBQ vegetable side."},\n pastasalad:{name:"Pasta Salad",group:"main",unit:"recipe",base:1.5,min:0.5,sensitivity:.55,round:.5,fill:"recipe",note:"Classic cold BBQ side; practical make-ahead option."}\n};'''
    once(app,anchor,repl)
s=Path(app).read_text()
old='const sideOrder=["mac","cauli","slaw","collards","broccoli","cucumber","kraut","beans","corn","cornbread","rolls"];'
new='const sideOrder=["asparagus","beans","broccoli","cauli","collards","corn","cucumber","greenbeans","kraut","mac","pastasalad","potatosalad","slaw","cornbread","rolls"];'
if old in s: once(app,old,new)
s=Path(app).read_text()
if 'tags.add("turkey")' not in s: once(app,'    if(k==="hog") tags.add("whole_hog");','    if(k==="hog") tags.add("whole_hog");\n    if(k==="turkey"){ tags.add("turkey"); tags.add("chicken_pulled"); tags.add("chicken_quarters"); tags.add("chicken_thighs"); }')
s=Path(app).read_text()
if 'case "greenbeans":' not in s: once(app,'    case "kraut":\n      return active.has("brats");','''    case "kraut":\n      return active.has("brats");\n    case "greenbeans":\n      return hasAnyTag(["prime_rib"]);\n    case "asparagus":\n      return hasAnyTag(["prime_rib"]);\n    case "potatosalad":\n      return active.size>0;\n    case "pastasalad":\n      return active.size>0;''')
s=Path(app).read_text()
old='const order=["chicken","fish","pork","hog","brats","brisket","pmbe","prime","ribs"];'
new='const order=["chicken","fish","pork","hog","brats","brisket","pmbe","prime","ribs","turkey"];'
if old in s: once(app,old,new)
s=Path(app).read_text().rstrip()
if s.endswith('calc();'): Path(app).write_text(s[:-7].rstrip()+'\n')
else: raise SystemExit('app.js final calc() anchor missing')

# The Worker becomes a transparent asset server: no request-time JS/HTML mutation.
Path('worker.js').write_text('''export default {\n  async fetch(request, env) {\n    return env.ASSETS.fetch(request);\n  },\n};\n''')

# Static CSS is loaded by the document, not injected by the Worker.
index='public/index.html'; s=Path(index).read_text()
if '/side-cleanup.css' not in s: once(index,'<link rel="manifest" href="/manifest.json">','<link rel="manifest" href="/manifest.json">\n<link rel="stylesheet" href="/side-cleanup.css?v=2.3.0">')

import fs from 'node:fs';
const p='public/index.html';
let s=fs.readFileSync(p,'utf8');
const m=s.match(/<script>([\s\S]*?)<\/script>/);
if(!m) throw new Error('inline script not found');
let js=m[1];
function removeFunc(src,name){const start=src.indexOf('function '+name+'(');if(start<0)return src;const brace=src.indexOf('{',start);let d=0;for(let i=brace;i<src.length;i++){if(src[i]==='{')d++;else if(src[i]==='}'&&!--d){let e=i+1;while(e<src.length&&src[e]==='\n')e++;return src.slice(0,start)+src.slice(e)}}throw new Error(name+' unclosed')}
for(const n of ['calc','buildSummary','multiplier'])js=removeFunc(js,n);
js=js.replace('V2.2.3 recommendation engine','Current recommendation engine');
fs.writeFileSync('public/app.js',js);
s=s.replace(m[0],'<script src="/app.js?v=2.2.8"></script>\n<script src="/meatfest-final.js?v=2.2.8"></script>');
s=s.replaceAll('2.2.3','2.2.8');
fs.writeFileSync(p,s);

/* Side display order — alphabetical within each existing side group.
   Keep Mac & Cheese and Cauliflower Mac & Cheese together as one block. */
(function(){
  function textOf(card){
    const b=card.querySelector('b');
    return (b?b.textContent:card.textContent).trim().replace(/\s+/g,' ');
  }
  function sortContainer(container){
    if(!container)return;
    const cards=[...container.querySelectorAll('.sideCard')];
    if(cards.length<2)return;
    const mac=cards.filter(c=>/mac\s*(and|&)\s*cheese/i.test(textOf(c)) || /cauliflower.*mac/i.test(textOf(c)));
    const normal=cards.filter(c=>!mac.includes(c));
    normal.sort((a,b)=>textOf(a).localeCompare(textOf(b),undefined,{sensitivity:'base'}));
    mac.sort((a,b)=>textOf(a).localeCompare(textOf(b),undefined,{sensitivity:'base'}));
    // Insert the Mac block where its first alphabetical item belongs.
    const blockName=mac.length?textOf(mac[0]):'';
    let inserted=false;
    const ordered=[];
    for(const card of normal){
      if(!inserted && blockName && blockName.localeCompare(textOf(card),undefined,{sensitivity:'base'})<0){
        ordered.push(...mac); inserted=true;
      }
      ordered.push(card);
    }
    if(!inserted)ordered.push(...mac);
    ordered.forEach(c=>container.appendChild(c));
  }
  function apply(){
    sortContainer(document.getElementById('mainSideCards'));
    sortContainer(document.getElementById('accompSideCards'));
  }
  let last='';
  setInterval(()=>{
    const root=document.getElementById('mainSideCards');
    const root2=document.getElementById('accompSideCards');
    const sig=[root,root2].map(x=>x?[...x.querySelectorAll('.sideCard')].map(textOf).join('|'):'').join('||');
    if(sig!==last){last=sig;apply();}
  },250);
  setTimeout(apply,0);
  setTimeout(apply,100);
  setTimeout(apply,500);
})();

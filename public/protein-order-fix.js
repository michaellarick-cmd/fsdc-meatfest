/* Protein display order — visual organization only; no category headers. */
(function(){
  const rank={
    "Brisket":1,
    "Poor Man's Burnt Ends":2,
    "Prime Rib":3,
    "Pulled Pork":4,
    "Ribs":5,
    "Polish Sausage / Brats":6,
    "Pork Belly Burnt Ends":7,
    "Chicken":8,
    "Turkey":9,
    "Fish":10,
    "Whole Hog":11
  };
  function renameAndSort(){
    const box=document.getElementById("meats");
    if(!box)return false;
    const cards=[...box.children];
    cards.forEach(card=>{
      if(card.innerHTML.includes("Chicken / Poultry")) card.innerHTML=card.innerHTML.replaceAll("Chicken / Poultry","Chicken");
      if(card.innerHTML.includes("Polish / Brats")) card.innerHTML=card.innerHTML.replaceAll("Polish / Brats","Polish Sausage / Brats");
    });
    const key=card=>{
      const text=card.textContent.replace(/\s+/g," ").trim();
      return Object.keys(rank).find(name=>text.includes(name))||"";
    };
    cards.sort((a,b)=>(rank[key(a)]||99)-(rank[key(b)]||99));
    cards.forEach(card=>box.appendChild(card));
    return true;
  }
  function apply(){renameAndSort();}
  const start=()=>{
    apply();
    const box=document.getElementById("meats");
    if(box){
      const observer=new MutationObserver(()=>{observer.disconnect();apply();observer.observe(box,{childList:true});});
      observer.observe(box,{childList:true});
    }
  };
  setTimeout(start,0);
  setTimeout(apply,100);
  setTimeout(apply,300);
})();

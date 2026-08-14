/* Protein display order — visual organization only; no category headers. */
(function(){
  const desired=[
    "brisket","pmbe","prime",
    "pork","ribs","brats","porkbelly",
    "chicken","turkey",
    "fish",
    "hog"
  ];
  function apply(){
    if(!Array.isArray(window.order)||typeof window.renderMeats!=="function")return;
    if(window.meats?.chicken) window.meats.chicken.name="Chicken";
    if(window.meats?.brats) window.meats.brats.name="Polish Sausage / Brats";
    const present=new Set(window.order);
    const arranged=desired.filter(k=>present.has(k));
    window.order.forEach(k=>{if(!arranged.includes(k))arranged.push(k)});
    window.order.splice(0,window.order.length,...arranged);
    window.renderMeats();
  }
  setTimeout(apply,0);
  setTimeout(apply,50);
  setTimeout(apply,250);
})();

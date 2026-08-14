/* Protein display order — visual organization only; no category headers. */
(function(){
  const desired=[
    "brisket","pmbe","prime",
    "pork","ribs","brats","porkbelly","hog",
    "chicken","turkey",
    "fish"
  ];
  function apply(){
    if(!Array.isArray(window.order)||typeof window.renderMeats!=="function")return;
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

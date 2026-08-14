/* Protein display order — visual organization only; no category headers. */
(function(){
  const desired=[
    "brisket","pmbe","prime",
    "pork","ribs","brats","porkbelly","hog",
    "chicken","turkey",
    "fish"
  ];
  function apply(){
    if(typeof order==="undefined"||typeof renderMeats!=="function")return;
    const present=new Set(order);
    const arranged=desired.filter(k=>present.has(k));
    order.forEach(k=>{if(!arranged.includes(k))arranged.push(k)});
    order.splice(0,order.length,...arranged);
    renderMeats();
  }
  setTimeout(apply,0);
  setTimeout(apply,50);
  setTimeout(apply,250);
})();

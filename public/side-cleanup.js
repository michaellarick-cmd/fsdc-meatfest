/* Meatfest sides presentation cleanup. Calculation logic remains in app.js. */
(() => {
  const polish = () => {
    const section = document.querySelector('#mainSideCards')?.closest('section.card');
    if (!section || section.dataset.sideCleanup === '1') return;
    section.dataset.sideCleanup = '1';

    const groups = section.querySelectorAll('.sideGroups > div');
    if (groups[0]) groups[0].insertAdjacentHTML('beforebegin', '<div class="sideIntro"><div><b>Build the menu</b><span>Pick the sides you actually want to serve.</span></div><span class="sideLegend"><i></i> Recommended pairing</span></div>');

    const titles = section.querySelectorAll('.sideGroupTitle');
    if (titles[0]) titles[0].innerHTML = 'SIDES';
    if (titles[1]) titles[1].innerHTML = 'ACCOMPANIMENTS';

    const refresh = () => {
      section.querySelectorAll('.sideCard').forEach(card => {
        const name = card.querySelector('b');
        const rec = card.querySelector('.sideRec');
        const small = card.querySelector('small');
        if (rec) rec.textContent = 'RECOMMENDED';
        if (small && !small.dataset.cleaned) {
          small.dataset.cleaned = '1';
          small.textContent = small.textContent.replace('Practical serving-pan unit', 'Serving-pan').replace('Prepared from your recipe', 'Recipe batch').replace('Whole ears → half-ear servings', 'Half-ear servings').replace('Plan pieces → buy packages', 'Pieces / packages').replace('Practical serving unit', 'Serving unit');
        }
        if (name) name.setAttribute('title', name.textContent.trim());
      });
    };
    refresh();
    new MutationObserver(refresh).observe(section, {subtree:true, childList:true, attributes:true, attributeFilter:['class']});
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', polish, {once:true});
  else polish();
  window.addEventListener('load', polish, {once:true});
})();

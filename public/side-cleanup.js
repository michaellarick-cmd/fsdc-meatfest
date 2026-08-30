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
        const small = card.querySelector('small');
        if (small && !small.dataset.cleaned) small.dataset.cleaned = '1';
      });
    };

    refresh();

    // renderSideCards() replaces card markup on selection. Observe only
    // child-list changes and make refresh() attribute-only so this observer
    // can never trigger itself.
    new MutationObserver(refresh).observe(section, {subtree:true, childList:true});
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', polish, {once:true});
  else polish();
  window.addEventListener('load', polish, {once:true});
})();

/* Meatfest UI render repair — does not change calculation logic. */
(function(){
  function repair(){
    try {
      if (typeof renderMeats === "function" && document.getElementById("meats")) renderMeats();
      if (typeof renderSideCards === "function" && document.getElementById("mainSideCards")) renderSideCards();
      if (typeof renderGuests === "function" && document.getElementById("guestList")) renderGuests();
      if (typeof calc === "function" && document.getElementById("results")) calc();
    } catch (e) {
      console.error("Meatfest render repair failed", e);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", repair, {once:true});
  else repair();
  setTimeout(repair, 50);
  setTimeout(repair, 250);
  setTimeout(repair, 750);
})();

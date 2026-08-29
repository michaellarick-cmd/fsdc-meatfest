/* Meatfest UI render repair — does not change calculation logic. */
(function(){
  function installLayoutFix(){
    if(document.getElementById("meatfest-layout-fix")) return;
    const style=document.createElement("style");
    style.id="meatfest-layout-fix";
    style.textContent=`
      .eventTitle{font-size:13px;font-weight:900;letter-spacing:.06em;color:#f0eee7;margin:0 0 8px}
      .eventGrid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:11px}
      .eventGrid label{display:block;color:var(--muted);font-size:11px;font-weight:800;margin:0}
      .eventGrid input{display:block;width:100%;margin-top:6px;background:var(--card2);border:1px solid #3a4047;color:var(--text);border-radius:11px;padding:11px;font-size:16px;outline:none;min-width:0}
      .eventGrid input:focus{border-color:var(--accent)}
      .servingChoices{display:grid;grid-template-columns:1fr;gap:8px}
      .servingChoice{width:100%;display:flex;align-items:center;gap:10px;text-align:left;border:1px solid #d7d7d7;background:#f1f1f1;color:#151515;border-radius:999px;padding:9px 13px;cursor:pointer;font:inherit;min-width:0}
      .servingChoice:hover{border-color:#999}
      .servingChoice.active{border-color:var(--accent);box-shadow:0 0 0 2px #f39a3233}
      .radioDot{width:18px;height:18px;border:2px solid #777;border-radius:50%;flex:0 0 auto;position:relative}
      .servingChoice.active .radioDot{border-color:#151515}
      .servingChoice.active .radioDot:after{content:"";position:absolute;width:8px;height:8px;left:3px;top:3px;border-radius:50%;background:var(--accent)}
      .servingCopy{display:grid;grid-template-columns:auto auto 1fr;align-items:baseline;column-gap:7px;row-gap:1px;min-width:0;flex:1}
      .servingCopy b{font-size:14px;line-height:1.15;white-space:nowrap}
      .servingCopy em{font-size:9px;font-style:normal;font-weight:900;letter-spacing:.05em;color:#8b5b20;white-space:nowrap}
      .servingCopy small{font-size:11px;color:#444;line-height:1.25;min-width:0}
      .hiddenServing{display:none!important}
      .servingNote{margin-top:9px;color:var(--muted);font-size:12px;line-height:1.4}
      @media(max-width:600px){
        .eventGrid{grid-template-columns:1fr 1fr;gap:9px}
        .eventGrid input{font-size:15px;padding:10px}
        .servingChoice{padding:9px 11px}
        .servingCopy{grid-template-columns:auto auto;column-gap:6px}
        .servingCopy small{grid-column:1 / -1;margin-top:1px}
      }
    `;
    document.head.appendChild(style);
  }
  function repair(){
    try {
      installLayoutFix();
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

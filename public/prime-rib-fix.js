/* Prime Rib planning options.
 * Boneless is the recommended Meatfest purchase because it is more efficient
 * by weight and easier to portion. Bone-in uses a lower yield for bone/trim.
 */
(function(){
  if(!window.meats || !meats.prime) return;
  meats.prime.default="boneless";
  meats.prime.options={
    boneless:{label:"Boneless Prime Rib — Recommended",yield:.75,unitWeight:5,unit:"boneless roast",mode:"units",note:"Recommended for Meatfest: more efficient by weight and easier to portion."},
    bone:{label:"Bone-in Standing Rib Roast",yield:.60,unitWeight:5,unit:"bone-in roast",mode:"units",note:"Lower planning yield accounts for bone and trim."}
  };
})();

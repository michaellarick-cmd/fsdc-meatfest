// DOM-free side planning engine. The browser UI imports these exact production rules.
export const sides={
 mac:{name:"Mac & Cheese",group:"main",unit:"tin",base:0.75,min:0.25,sensitivity:.45,round:.25,fill:"nearly full",note:"Anchor favorite; planned leftover is useful."},
 cauli:{name:"Cauliflower Mac & Cheese",group:"main",unit:"tin",base:0.75,min:0.25,sensitivity:.70,round:.25,fill:"nearly full",note:"Perennial favorite; historically less total demand than regular Mac."},
 slaw:{name:"Coleslaw",group:"main",unit:"recipe",base:2.50,min:0.5,sensitivity:.45,round:.5,fill:"recipe",note:"Anchor favorite; your 2024 double recipe ran out."},
 collards:{name:"Collard Greens",group:"main",unit:"recipe",base:1.25,min:0.5,sensitivity:.70,round:.25,fill:"recipe",note:"Popular, but leftovers are intentionally limited because they do not reheat well."},
 broccoli:{name:"Broccoli Salad",group:"main",unit:"recipe",base:1.0,min:0.5,sensitivity:.70,round:.25,fill:"recipe",note:"BBQ-style salad; one recipe has historically been about right."},
 cucumber:{name:"Cucumber Salad",group:"main",unit:"recipe",base:1.0,min:0.5,sensitivity:.70,round:.25,fill:"recipe",note:"One recipe has historically been about right."},
 kraut:{name:"Sauerkraut",group:"main",unit:"tin",base:0.50,min:0.25,sensitivity:.90,round:.25,fill:"thumb clearance",note:"Strongly paired with Polish Brats; keep leftovers tight because it does not reheat well."},
 beans:{name:"Baked Beans",group:"main",unit:"tin",base:0.50,min:0.25,sensitivity:.90,round:.25,fill:"thumb clearance",note:"Deliberately restrained; Meatfest history shows chronic overproduction."},
 corn:{name:"Corn on the Cob",group:"unit",unit:"ear",base:7,min:4,sensitivity:.60,round:2,fill:"half-ear portions",note:"Served as half ears. Historical target is deliberately modest."},
 cornbread:{name:"Cornbread",group:"accomp",unit:"piece",base:24,min:12,sensitivity:.20,round:6,fill:"mini cupcake",recipePieces:24,note:"BBQ accompaniment; traditional + gluten-free pieces can be mixed as needed."},
 rolls:{name:"Hawaiian Rolls",group:"accomp",unit:"piece",base:16,min:8,sensitivity:.10,round:8,fill:"piece",packagePieces:32,note:"Sandwich vehicle for pulled pork, pulled chicken and sliced brisket. Costco twin pack is 32 rolls."}
};
export const sideOrder=["mac","cauli","slaw","collards","broccoli","cucumber","kraut","beans","corn","cornbread","rolls"];
export function sideProteinFactor(n){return ({1:1.20,2:1.15,3:1.10,4:1.05,5:1.00,6:.95,7:.92,8:.90})[Math.max(1,Math.min(8,n))]||.90}
export function sideVarietyFactor(n){return ({1:1.35,2:1.18,3:1.08,4:1.00,5:.97,6:.94,7:.92,8:.90})[Math.max(1,Math.min(8,n))]||.90}
export function roundUpTo(x,step){return Math.ceil((x-1e-9)/step)*step}
export function roundNearest(x,step){return Math.round(x/step)*step}
export function sideQty(id,{eaters,proteinCount=1,mainSideCount=1,planningMode="meatfest",hasBrats=false,sandwichProteinCount=0}={}){
  const s=sides[id];
  if(!s || !Number.isFinite(eaters) || eaters<=0)return 0;
  const pFactor=sideProteinFactor(proteinCount);
  const vFactor=sideVarietyFactor(mainSideCount);
  let q=s.base*(eaters/47)*pFactor*(1+(vFactor-1)*s.sensitivity);
  if(planningMode==="family")q*=1.125;
  if(id==="kraut"&&hasBrats)q*=1.15;
  if(id==="corn"&&proteinCount>=4)q*=.90;
  if(id==="rolls")q*=sandwichProteinCount?(0.65+0.12*Math.min(3,sandwichProteinCount)):.35;
  if(id==="cornbread")q*=proteinCount?(1.0+0.06*Math.min(4,proteinCount)):0;
  if(planningMode==="family")q=Math.max(s.min,q);
  else if(s.unit==="tin"||s.unit==="recipe")q=Math.max(s.base,q);
  else q=Math.max(s.min,q);
  if(s.unit==="tin")return roundNearest(q,s.round);
  if(s.unit==="recipe")return roundUpTo(q,s.round);
  if(s.unit==="ear")return Math.max(4,roundUpTo(q,2));
  return Math.max(s.min,roundUpTo(q,s.round));
}

/* FSDC Meatfest additions — keep future protein/side additions here. */
(function(){
  const TURKEY_KEY="turkey";
  const TURKEY_OPTIONS={
    whole:{label:"Whole Turkey",yield:.55,unitWeight:14,unit:"whole turkey",mode:"units",note:"Whole-bird purchase; practical bird sizes are used and leftovers are planned."},
    breast:{label:"Turkey Breast",yield:.65,unitWeight:7,unit:"turkey breast",mode:"units",note:"Bone-in turkey breast; practical for Texas-style smoked turkey and smaller gatherings."},
    legs:{label:"Turkey Legs",yield:.45,unitWeight:.75,unit:"turkey leg",mode:"units",note:"Individual BBQ turkey legs; purchase by the leg rather than by bulk weight."}
  };

  meats[TURKEY_KEY]={name:"Turkey",default:"whole",options:TURKEY_OPTIONS};
  if(!order.includes(TURKEY_KEY)) order.push(TURKEY_KEY);
  choices[TURKEY_KEY]=choices[TURKEY_KEY]||meats[TURKEY_KEY].default;

  // Pork Belly Burnt Ends: rich secondary protein. Keep the user's universal
  // portion choices (¼ / ⅓ / ½ lb) while applying a 25% richness adjustment
  // to the standard ⅓-lb target. Planning yield is 62% for skinless belly.
  const PORK_BELLY_KEY="porkbelly";
  meats[PORK_BELLY_KEY]={
    name:"Pork Belly Burnt Ends",
    default:"belly",
    options:{
      belly:{
        label:"Skinless Pork Belly",
        yield:.62,
        unitWeight:10,
        unit:"whole pork belly",
        mode:"units",
        note:"Rich secondary protein. Whole skinless bellies commonly run about 8–10 lb; portion and freeze any excess for a future cook."
      }
    }
  };
  if(!order.includes(PORK_BELLY_KEY)) order.push(PORK_BELLY_KEY);
  choices[PORK_BELLY_KEY]=choices[PORK_BELLY_KEY]||meats[PORK_BELLY_KEY].default;

  sides.greenbeans={name:"Green Beans",group:"main",unit:"recipe",base:1.0,min:.5,sensitivity:.70,round:.25,fill:"recipe",note:"Grilled or smoked BBQ vegetable side."};
  sides.asparagus={name:"Asparagus",group:"main",unit:"recipe",base:1.0,min:.5,sensitivity:.70,round:.25,fill:"recipe",note:"Grilled or smoked BBQ vegetable side."};
  sides.potatosalad={name:"Potato Salad",group:"main",unit:"recipe",base:1.5,min:.5,sensitivity:.55,round:.5,fill:"recipe",note:"Classic BBQ side."};
  sides.pastasalad={name:"Pasta Salad",group:"main",unit:"recipe",base:1.5,min:.5,sensitivity:.55,round:.5,fill:"recipe",note:"Classic BBQ side."};
  ["greenbeans","asparagus","potatosalad","pastasalad"].forEach(id=>{if(!sideOrder.includes(id))sideOrder.push(id)});

  // Turkey and pork belly have practical whole-piece family purchase units.
  const baseFamilyPurchase=familyPurchase;
  familyPurchase=function(k,o,bought){
    if(k===PORK_BELLY_KEY){
      const w=Number(bought);
      const units=Math.max(1,Math.ceil((w-1e-9)/10));
      return {
        units,
        buyWeight:units*10,
        buy:`BUY ${units} whole skinless pork belly${units===1?"":"s"} (~${units*10} lb total)`,
        note:"Whole bellies commonly run about 8–10 lb. If the package is larger than needed, portion and freeze the excess for a future cook.",
      };
    }
    if(k!==TURKEY_KEY)return baseFamilyPurchase(k,o,bought);
    const lb=x=>Math.ceil((x-1e-9)*10)/10;
    const form=choices[TURKEY_KEY]||"whole";
    if(form==="whole"){
      const w=Math.max(8,Math.ceil((bought-1e-9)/2)*2);
      return {units:1,buyWeight:w,buy:`ASK FOR ~${lb(w)} lb whole turkey`,note:"Family-size whole bird; a smaller turkey is practical and excess is planned leftovers."};
    }
    if(form==="breast"){
      const w=Math.max(3,Math.ceil((bought-1e-9)*2)/2);
      return {units:1,buyWeight:w,buy:`ASK FOR ~${lb(w)} lb turkey breast`,note:"Turkey breast is a practical alternative when a whole bird is unavailable or not wanted."};
    }
    const legs=Math.max(1,Math.ceil((bought-1e-9)/.75)),w=legs*.75;
    return {units:legs,buyWeight:w,buy:`BUY ${legs} turkey leg${legs===1?"":"s"} (~${lb(w)} lb total)`,note:"BBQ turkey legs are planned and purchased as individual legs."};
  };

  // Refresh the existing UI using the site's normal rendering/calculation functions.
  renderMeats();
  renderSideCards();
  calc();
})();

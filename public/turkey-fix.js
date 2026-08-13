/* Turkey protein extension — V2.2.x
 * One protein, three real-world purchase forms:
 * whole bird, turkey breast, turkey legs.
 */
(function(){
  if (typeof meats === "undefined" || typeof order === "undefined" || typeof choices === "undefined") return;

  meats.turkey = {
    name: "Turkey",
    default: "whole",
    options: {
      whole: {
        label: "Whole Turkey",
        yield: .55,
        unitWeight: 14,
        unit: "whole turkey",
        mode: "units",
        note: "Whole-bird purchase; practical bird sizes are used and leftovers are planned."
      },
      breast: {
        label: "Turkey Breast",
        yield: .65,
        unitWeight: 7,
        unit: "turkey breast",
        mode: "units",
        note: "Bone-in turkey breast; practical for Texas-style smoked turkey and smaller gatherings."
      },
      legs: {
        label: "Turkey Legs",
        yield: .45,
        unitWeight: .75,
        unit: "turkey leg",
        mode: "units",
        note: "Individual BBQ turkey legs; purchase by the leg rather than by bulk weight."
      }
    }
  };

  choices.turkey = choices.turkey || meats.turkey.default;
  if (!order.includes("turkey")) order.push("turkey");

  const priorFamilyPurchase = familyPurchase;
  familyPurchase = function(k, o, bought){
    if (k === "turkey") {
      const lb = x => Math.ceil((x - 1e-9) * 10) / 10;
      const form = choices.turkey || "whole";

      if (form === "whole") {
        const w = Math.max(8, Math.ceil((bought - 1e-9) / 2) * 2);
        return {
          units: 1,
          buyWeight: w,
          buy: `ASK FOR ~${lb(w)} lb whole turkey`,
          note: "Family-size whole bird; a smaller turkey is practical for a small BBQ and excess is planned leftovers."
        };
      }

      if (form === "breast") {
        const w = Math.max(3, Math.ceil((bought - 1e-9) * 2) / 2);
        return {
          units: 1,
          buyWeight: w,
          buy: `ASK FOR ~${lb(w)} lb turkey breast`,
          note: "Turkey breast is a practical alternative when a whole bird is unavailable or not wanted."
        };
      }

      const legWeight = .75;
      const legs = Math.max(1, Math.ceil((bought - 1e-9) / legWeight));
      const w = legs * legWeight;
      return {
        units: legs,
        buyWeight: w,
        buy: `BUY ${legs} turkey leg${legs === 1 ? "" : "s"} (~${lb(w)} lb total)`,
        note: "BBQ turkey legs are planned and purchased as individual legs."
      };
    }
    return priorFamilyPurchase(k, o, bought);
  };

  if (typeof selectedProteinTags === "function") {
    const priorTags = selectedProteinTags;
    selectedProteinTags = function(){
      const tags = priorTags();
      if (selected.has("turkey")) {
        tags.add("turkey");
        if (choices.turkey === "breast") tags.add("turkey_breast");
        if (choices.turkey === "legs") tags.add("turkey_legs");
        if (choices.turkey === "whole") tags.add("turkey_whole");
      }
      return tags;
    };
  }

  renderMeats();
  calc();
})();

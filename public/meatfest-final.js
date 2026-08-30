/* FSDC Meatfest — browser presentation layer for the shared MeatEngine. */
(() => {
  // Meatfest-specific presentation metadata belongs here as committed source.
  // The Worker serves these assets unchanged; no request-time patching occurs.
  Object.assign(sides, {
    greenbeans:{name:"Green Beans",group:"main",unit:"recipe",base:1.0,min:0.5,sensitivity:.70,round:.25,fill:"recipe",note:"Grilled or smoked BBQ vegetable side."},
    potatosalad:{name:"Potato Salad",group:"main",unit:"recipe",base:1.5,min:0.5,sensitivity:.55,round:.5,fill:"recipe",note:"Classic BBQ side."},
    asparagus:{name:"Asparagus",group:"main",unit:"recipe",base:1.0,min:0.5,sensitivity:.70,round:.25,fill:"recipe",note:"Grilled or smoked BBQ vegetable side."},
    pastasalad:{name:"Pasta Salad",group:"main",unit:"recipe",base:1.5,min:0.5,sensitivity:.55,round:.5,fill:"recipe",note:"Classic cold BBQ side; practical make-ahead option."}
  });
  sideOrder.splice(0, sideOrder.length, "asparagus","beans","broccoli","cauli","collards","corn","cucumber","greenbeans","kraut","mac","pastasalad","potatosalad","slaw","cornbread","rolls");

  meats.turkey = {
    name: "Turkey",
    default: "whole",
    options: {
      whole: {label:"Whole Turkey",yield:.55,unitWeight:14,unit:"whole turkey",mode:"units"},
      breast: {label:"Turkey Breast",yield:.65,unitWeight:7,unit:"turkey breast",mode:"units"},
      legs: {label:"Turkey Legs",yield:.45,unitWeight:.75,unit:"turkey leg",mode:"units"}
    }
  };
  if (!order.includes("turkey")) order.push("turkey");
  if (!choices.turkey) choices.turkey = meats.turkey.default;

  // Turkey intentionally follows the chicken/poultry recommendation set.
  function proteinTagsForRecommendations() {
    const tags = new Set();
    selected.forEach(key => {
      if (key === "chicken") {
        const prep = choices.chicken || meats.chicken.default;
        if (prep === "whole") tags.add("chicken_pulled");
        else if (prep === "legq") tags.add("chicken_quarters");
        else if (prep === "thigh") tags.add("chicken_thighs");
      } else if (key === "turkey") {
        tags.add("chicken_pulled");
        tags.add("chicken_quarters");
        tags.add("chicken_thighs");
      } else if (key === "fish") tags.add("fish");
      else if (key === "pork") tags.add("pulled_pork");
      else if (key === "brisket") tags.add("brisket");
      else if (key === "pmbe") tags.add("pmbe");
      else if (key === "brats") tags.add("brats");
      else if (key === "ribs") tags.add("ribs");
      else if (key === "prime") tags.add("prime_rib");
      else if (key === "hog") tags.add("whole_hog");
    });
    return tags;
  }

  sideRecommendation = function (id) {
    const active = proteinTagsForRecommendations();
    const any = tags => tags.some(tag => active.has(tag));
    switch (id) {
      case "mac": return active.size > 0;
      case "cauli": return any(["chicken_pulled","chicken_quarters","chicken_thighs","fish"]);
      case "slaw": return any(["pulled_pork","brisket","pmbe","ribs","brats","chicken_pulled","chicken_quarters","chicken_thighs","fish"]);
      case "collards": return any(["pulled_pork","brisket","pmbe","ribs"]);
      case "broccoli": return any(["fish","chicken_pulled","chicken_quarters","chicken_thighs","pulled_pork","brisket","pmbe","ribs"]);
      case "cucumber": return any(["fish","chicken_pulled","chicken_quarters","chicken_thighs"]);
      case "kraut": return active.has("brats");
      case "beans": return false;
      case "corn": return any(["chicken_pulled","chicken_quarters","chicken_thighs","fish","pulled_pork","brisket","pmbe","ribs"]);
      case "cornbread": return active.size > 0;
      case "rolls": return any(["pulled_pork","chicken_pulled","brisket"]);
      case "greenbeans": return active.has("prime_rib");
      case "asparagus": return active.has("prime_rib");
      case "potatosalad": return active.size > 0;
      case "pastasalad": return active.size > 0;
      default: return false;
    }
  };

  // Whole-hog preparation is a presentation choice, but the calculation
  // itself remains entirely inside MeatEngine. Default preserves the original
  // Meatfest model: hanging weight with head + feet on.
  meats.hog.options = {
    headfeet: {
      label: "Head & Feet On", yield: "hog", unitWeight: null, unit: "whole hog", mode: "hog", headFeet: "on",
      note: "Original Meatfest whole-hog model: hanging weight with head + feet on."
    },
    headoff: {
      label: "Head & Feet Off", yield: "hog", unitWeight: null, unit: "whole hog", mode: "hog", headFeet: "off",
      note: "Hanging-weight target adjusted 7% lower for head + feet removed."
    }
  };
  if (!meats.hog.options[choices.hog]) choices.hog = "headfeet";

  function activeEaters() {
    const [adults, kids] = activeTotals();
    return { adults, kids, eaters: adults + kids * 0.5 };
  }

  function portion() {
    return Number($("serving").value) || MeatEngine.STANDARD_SERVING;
  }

  function rowFor(key, eaters) {
    const m = meats[key];
    const choiceId = choices[key] || m.default;
    const option = m.options[choiceId];
    const row = MeatEngine.canonicalRow({
      key,
      eaters,
      serving: portion(),
      choice: { id: choiceId, unit: option?.unit, headFeet: option?.headFeet }
    });
    if (!row) return null;

    let buy;
    let note = option?.note || "";
    if (key === "hog") {
      const prep = option.headFeet === "off" ? "head & feet off" : "head & feet on";
      buy = `TARGET ~${Math.ceil(row.buyWeight)} lb hanging weight (${prep})`;
      note = option.headFeet === "off"
        ? "Whole-hog target uses the validated Meatfest hanging-weight curve with a 7% adjustment for head + feet removed. No live-weight conversion is used."
        : "Whole-hog target uses the validated Meatfest hanging-weight curve. No live-weight conversion is used. This preserves the original head + feet-on model.";
    } else if (key === "ribs") {
      buy = `BUY ${row.units} rack${row.units === 1 ? "" : "s"} (~${MeatEngine.round1(row.buyWeight)} lb total)`;
      note = `Count-based planning: ${MeatEngine.round1(eaters * MeatEngine.ANCHORS.ribsTakeRate * (portion() / MeatEngine.STANDARD_SERVING))} takers × ${MeatEngine.ANCHORS.ribsPerTaker} ribs ÷ ${MeatEngine.ANCHORS.ribsPerRack} ribs/rack.`;
    } else if (key === "brats") {
      buy = `BUY ${row.units} half-lb link${row.units === 1 ? "" : "s"} (~${MeatEngine.round1(row.buyWeight)} lb total)`;
      note = "Established Meatfest sausage planning unit: about one ½-lb link per six adult-equivalent eaters.";
    } else if (key === "brisket") {
      buy = `BUY 1 packer (~${MeatEngine.round1(row.buyWeight)} lb; ask for a 19–20 lb packer)`;
      note = "Meatfest anchor: one practical whole packer; do not split a 19–20 lb requirement into multiple small packers.";
    } else if (key === "pmbe") {
      buy = `BUY ${row.units} chuck roast${row.units === 1 ? "" : "s"} (~${MeatEngine.round1(row.buyWeight)} lb total)`;
      note = "Meatfest PMBE anchor: four 4-lb chuck roasts at 48 adult-equivalent eaters.";
    } else if (key === "pork") {
      buy = `BUY ${row.units} bone-in butt${row.units === 1 ? "" : "s"} (~${MeatEngine.round1(row.buyWeight)} lb total)`;
      note = "Meatfest pulled-pork anchor: two 8.5-lb bone-in butts at 48 adult-equivalent eaters.";
    } else if (key === "chicken") {
      buy = `BUY ${row.units} whole chicken${row.units === 1 ? "" : "s"} (~${MeatEngine.round1(row.buyWeight)} lb total)`;
      note = "Meatfest whole-chicken anchor: four 5-lb fryers at 48 adult-equivalent eaters.";
    } else if (key === "turkey") {
      buy = `BUY ${row.units} ${option.unit}${row.units === 1 ? "" : "s"} (~${MeatEngine.round1(row.buyWeight)} lb total)`;
      note = "Turkey uses a dedicated yield and purchase-unit model; side recommendations follow the chicken/poultry pairing set.";
    }
    return { key, m, option, row, buy, note };
  }

  window.calc = function () {
    const t = activeEaters();
    const rows = [...selected].map(key => rowFor(key, t.eaters)).filter(Boolean);
    const total = rows.reduce((sum, item) => sum + item.row.buyWeight, 0);
    $("statAdults").textContent = t.adults;
    $("statKids").textContent = t.kids;
    $("statEaters").textContent = MeatEngine.round1(t.eaters);
    $("totalRaw").textContent = total ? `${MeatEngine.round1(total)} lb` : "0 lb";
    $("summary").textContent = rows.length
      ? `${rows.length} protein${rows.length > 1 ? "s" : ""} • ${MeatEngine.round1(t.eaters)} adult-equivalent eaters${planningMode === "family" ? " • 10–15% family cushion" : ""}`
      : "Select at least one protein.";
    calcSides();
  };

  window.buildSummary = function () {
    const t = activeEaters();
    const rows = [...selected].map(key => rowFor(key, t.eaters)).filter(Boolean);
    return { adults: t.adults, kids: t.kids, eaters: t.eaters, rows, total: rows.reduce((s, r) => s + r.row.buyWeight, 0) };
  };

  renderMeats();
  renderSideCards();
  window.calc();
})();

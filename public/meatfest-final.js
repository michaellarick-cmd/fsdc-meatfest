/* FSDC Meatfest — browser presentation layer for the shared MeatEngine. */
(() => {
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
      choice: { id: choiceId, unit: option?.unit }
    });
    if (!row) return null;

    let buy;
    let note = option?.note || "";
    if (key === "ribs") {
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

    $("results").innerHTML = rows.length ? rows.map(({ key, m, option, row, buy, note }) => {
      const excess = row.excess > 0.5 ? ` • Planned excess: <span class="excess">${MeatEngine.round1(row.excess)} lb</span>` : "";
      const unit = (key !== "ribs" && key !== "brats" && option.mode === "units")
        ? ` • Planning unit: ${key === "chicken" ? MeatEngine.ANCHORS.chickenLb : key === "pmbe" ? 4 : key === "pork" ? 8.5 : option.unitWeight} lb`
        : "";
      const yieldRate = typeof option.yield === "number" ? option.yield : 1;
      return `<div class="result"><div class="resultTop"><div><div class="resultTitle">${m.name}</div><span class="pill">${option.label}</span><span class="pill">${Math.round(yieldRate * 100)}% yield</span></div><div class="buy">${buy}</div></div><div class="details">Finished meat needed: <b>${MeatEngine.round1(row.finished)} lb</b> • Raw requirement: <b>${MeatEngine.round1(row.raw)} lb</b>${unit}${excess}</div>${note ? `<div class="purchaseNote">${note}</div>` : ""}</div>`;
    }).join("") : "<p class='note'>Select at least one protein.</p>";

    calcSides();
  };

  window.buildSummary = function () {
    const t = activeEaters();
    const rows = [...selected].map(key => rowFor(key, t.eaters)).filter(Boolean);
    return { adults: t.adults, kids: t.kids, eaters: t.eaters, rows, total: rows.reduce((s, r) => s + r.row.buyWeight, 0) };
  };

  // app.js wires the UI and restores saved state before this presentation layer loads.
  // Initial calculation belongs here, after the calculation engine exists.
  window.calc();
})();

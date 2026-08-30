/* FSDC Meatfest — single source of truth for canonical Meatfest protein math. */
(() => {
  const BASE_EATERS = 48;
  const STANDARD_SERVING = 1 / 3;
  const PORTIONS = Object.freeze({ brisketYield: .50, pmbeYield: .60, porkYield: .60, chickenYield: .62, ribsYield: .70, bratYield: .90 });
  const ANCHORS = Object.freeze({ brisketLb: 19.5, pmbeLb: 16, porkLb: 17, chickenBirds: 4, chickenLb: 5, ribsRacks: 5, ribsPerRack: 11, ribRackLb: 2.25, ribsTakeRate: .60, ribsPerTaker: 1.75, bratLinks: 8, bratLinkLb: .5, bratsPerEater: 1/6 });
  const round1 = x => Math.round((x + Number.EPSILON) * 10) / 10;
  const roundUp = (x, unit) => Math.max(1, Math.ceil((x - 1e-9) / unit));
  const scaleFor = (eaters, serving) => (eaters / BASE_EATERS) * (Number(serving) / STANDARD_SERVING);

  function canonicalRow({ key, eaters, serving = STANDARD_SERVING, choice = {} }) {
    const scale = scaleFor(eaters, serving);
    const portion = Number(serving) / STANDARD_SERVING;
    let raw, finished, units, buyWeight;
    if (key === 'ribs') {
      const ribsNeeded = eaters * ANCHORS.ribsTakeRate * ANCHORS.ribsPerTaker * portion;
      units = roundUp(ribsNeeded / ANCHORS.ribsPerRack, 1);
      buyWeight = units * ANCHORS.ribRackLb;
      raw = (ribsNeeded / ANCHORS.ribsPerRack) * ANCHORS.ribRackLb;
      finished = raw * PORTIONS.ribsYield;
    } else if (key === 'brats') {
      const linksNeeded = eaters * ANCHORS.bratsPerEater * portion;
      units = roundUp(linksNeeded, 1);
      buyWeight = units * ANCHORS.bratLinkLb;
      raw = linksNeeded * ANCHORS.bratLinkLb;
      finished = raw * PORTIONS.bratYield;
    } else if (key === 'brisket' && choice.id === 'packer') {
      raw = ANCHORS.brisketLb * scale; units = 1; buyWeight = Math.max(14, raw); finished = raw * PORTIONS.brisketYield;
    } else if (key === 'pmbe') {
      raw = ANCHORS.pmbeLb * scale; units = roundUp(raw, 4); buyWeight = units * 4; finished = raw * PORTIONS.pmbeYield;
    } else if (key === 'pork') {
      raw = ANCHORS.porkLb * scale; units = roundUp(raw, 8.5); buyWeight = units * 8.5; finished = raw * PORTIONS.porkYield;
    } else if (key === 'chicken' && choice.unit === 'whole fryer') {
      const birdsNeeded = ANCHORS.chickenBirds * scale;
      units = roundUp(birdsNeeded, 1); buyWeight = units * ANCHORS.chickenLb; raw = birdsNeeded * ANCHORS.chickenLb; finished = raw * PORTIONS.chickenYield;
    } else return null;
    return { raw, finished, units, buyWeight, excess: Math.max(0, buyWeight - raw) };
  }

  globalThis.MeatEngine = Object.freeze({ BASE_EATERS, STANDARD_SERVING, ANCHORS, PORTIONS, round1, roundUp, canonicalRow });
})();

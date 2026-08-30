/* FSDC Meatfest — single source of truth for canonical Meatfest protein math. */
(() => {
  const BASE_EATERS = 48;
  const STANDARD_SERVING = 1 / 3;
  const PORTIONS = Object.freeze({
    brisketYield: .50,
    brisketFlatYield: .55,
    pmbeYield: .60,
    porkYield: .60,
    chickenYield: .62,
    chickenLegQuarterYield: .42,
    chickenThighYield: .52,
    fishYield: .76,
    primeRibYield: .80,
    turkeyYield: .55,
    turkeyBreastYield: .65,
    turkeyLegYield: .45,
    ribsYield: .70,
    bratYield: .90
  });
  const ANCHORS = Object.freeze({
    brisketLb: 19.5,
    pmbeLb: 16,
    porkLb: 17,
    chickenBirds: 4,
    chickenLb: 5,
    chickenLegQuarterLb: .59375,
    chickenThighLb: .25,
    fishFiletLb: .33,
    primeRibRoastLb: 5,
    brisketFlatLb: 7,
    porkBonelessLb: 8,
    turkeyLb: 14,
    turkeyBreastLb: 7,
    turkeyLegLb: .75,
    ribsRacks: 5,
    ribsPerRack: 11,
    ribRackLb: 2.25,
    ribsTakeRate: .60,
    ribsPerTaker: 1.75,
    bratLinks: 8,
    bratLinkLb: .5,
    bratsPerEater: 1 / 6,
    wholeHogHeadFeetOffFactor: .93,
    wholeHogYieldCurve: Object.freeze([[41.6667,.40],[55.5556,.45],[66.6667,.50],[100,.55],[150,.60]])
  });
  const round1 = x => Math.round((x + Number.EPSILON) * 10) / 10;
  const roundUp = (x, unit) => Math.max(1, Math.ceil((x - 1e-9) / unit));
  const scaleFor = (eaters, serving) => (eaters / BASE_EATERS) * (Number(serving) / STANDARD_SERVING);

  function wholeHogYield(hangingWeight) {
    const p = ANCHORS.wholeHogYieldCurve;
    if (hangingWeight <= p[0][0]) return p[0][1];
    for (let i = 1; i < p.length; i++) {
      const [x2, y2] = p[i], [x1, y1] = p[i - 1];
      if (hangingWeight <= x2) return y1 + ((hangingWeight - x1) / (x2 - x1)) * (y2 - y1);
    }
    return p[p.length - 1][1];
  }

  function wholeHogPlan(finishedMeat, headFeet = 'on') {
    // The production Meatfest curve is defined from hanging weight, never
    // live weight. It preserves the original head + feet-on model. For head
    // + feet off, the validated planning adjustment reduces the required
    // hanging weight by 7%.
    let onWeight = Math.max(0.1, finishedMeat / .50);
    for (let i = 0; i < 40; i++) {
      const next = finishedMeat / wholeHogYield(onWeight);
      if (Math.abs(next - onWeight) < 0.0001) { onWeight = next; break; }
      onWeight = next;
    }
    const factor = headFeet === 'off' ? ANCHORS.wholeHogHeadFeetOffFactor : 1;
    const hangingWeight = onWeight * factor;
    return { hangingWeight, yield: finishedMeat / hangingWeight, headFeet };
  }

  function unitProteinRow(finished, unitWeight, yieldRate) {
    const raw = finished / yieldRate;
    const units = roundUp(raw, unitWeight);
    const buyWeight = units * unitWeight;
    return { raw, finished: raw * yieldRate, units, buyWeight, excess: Math.max(0, buyWeight - raw) };
  }

  function canonicalRow({ key, eaters, serving = STANDARD_SERVING, choice = {} }) {
    const scale = scaleFor(eaters, serving);
    const portion = Number(serving) / STANDARD_SERVING;
    let raw, finished, units, buyWeight;
    if (key === 'hog') {
      finished = eaters * Number(serving);
      const plan = wholeHogPlan(finished, choice.headFeet || 'on');
      raw = plan.hangingWeight;
      units = 1;
      buyWeight = Math.ceil(raw - 1e-9);
    } else if (key === 'ribs') {
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
    } else if (key === 'brisket' && choice.id === 'flat') {
      return unitProteinRow(eaters * Number(serving), ANCHORS.brisketFlatLb, PORTIONS.brisketFlatYield);
    } else if (key === 'pmbe') {
      raw = ANCHORS.pmbeLb * scale; units = roundUp(raw, 4); buyWeight = units * 4; finished = raw * PORTIONS.pmbeYield;
    } else if (key === 'pork' && choice.id === 'boneless') {
      return unitProteinRow(eaters * Number(serving), ANCHORS.porkBonelessLb, PORTIONS.porkYield);
    } else if (key === 'pork') {
      raw = ANCHORS.porkLb * scale; units = roundUp(raw, 8.5); buyWeight = units * 8.5; finished = raw * PORTIONS.porkYield;
    } else if (key === 'chicken' && choice.unit === 'whole fryer') {
      const birdsNeeded = ANCHORS.chickenBirds * scale;
      units = roundUp(birdsNeeded, 1); buyWeight = units * ANCHORS.chickenLb; raw = birdsNeeded * ANCHORS.chickenLb; finished = raw * PORTIONS.chickenYield;
    } else if (key === 'chicken' && choice.id === 'legq') {
      return unitProteinRow(eaters * Number(serving), ANCHORS.chickenLegQuarterLb, PORTIONS.chickenLegQuarterYield);
    } else if (key === 'chicken' && choice.id === 'thigh') {
      return unitProteinRow(eaters * Number(serving), ANCHORS.chickenThighLb, PORTIONS.chickenThighYield);
    } else if (key === 'fish') {
      return unitProteinRow(eaters * Number(serving), ANCHORS.fishFiletLb, PORTIONS.fishYield);
    } else if (key === 'prime') {
      return unitProteinRow(eaters * Number(serving), ANCHORS.primeRibRoastLb, PORTIONS.primeRibYield);
    } else if (key === 'turkey') {
      const unitWeight = choice.id === 'breast' ? ANCHORS.turkeyBreastLb : choice.id === 'legs' ? ANCHORS.turkeyLegLb : ANCHORS.turkeyLb;
      const yieldRate = choice.id === 'breast' ? PORTIONS.turkeyBreastYield : choice.id === 'legs' ? PORTIONS.turkeyLegYield : PORTIONS.turkeyYield;
      const result = unitProteinRow(eaters * Number(serving), unitWeight, yieldRate);
      return result;
    } else return null;
    return { raw, finished, units, buyWeight, excess: Math.max(0, buyWeight - raw) };
  }

  globalThis.MeatEngine = Object.freeze({ BASE_EATERS, STANDARD_SERVING, ANCHORS, PORTIONS, round1, roundUp, wholeHogYield, wholeHogPlan, canonicalRow });
})();
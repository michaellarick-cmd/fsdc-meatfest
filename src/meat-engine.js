const BASE_EATERS = 48;
const STANDARD_SERVING = 1 / 3;
const MEATFEST_TAKE_RATE = 0.60;
const RIBS_PER_TAKER = 1.75;
const RIBS_PER_RACK = 11;
const RIB_RACK_LB = 2.25;
const BRATS_PER_EATER = 1 / 6;
const BRAT_LINK_LB = 0.50;

export const MEATFEST_ANCHORS = Object.freeze({
  brisketLb: 19.5,
  pmbeLb: 16,
  porkLb: 17,
  chickenBirds: 4,
});

export function multiplier(proteinCount) {
  // Retained as a compatibility API. Meatfest no longer silently applies a
  // generic protein-count multiplier to every protein; each protein has its
  // own validated planning anchor.
  return proteinCount > 0 ? 1 : 0;
}

export function calculateFinishedProtein({ adults = 0, kids = 0, selected, serving = STANDARD_SERVING, mode = 'meatfest' }) {
  const eaters = Number(adults) + Number(kids) * 0.5;
  const proteins = [...selected];
  if (!eaters || !proteins.length) return [];

  if (mode === 'family') {
    const finishedTotal = eaters * Number(serving);
    const perProtein = finishedTotal / proteins.length;
    return proteins.map((id) => ({ id, finishedLb: perProtein, mode, servingLb: Number(serving) }));
  }

  const scale = (eaters / BASE_EATERS) * (Number(serving) / STANDARD_SERVING);
  const finished = {
    brisket: MEATFEST_ANCHORS.brisketLb * 0.50,
    pmbe: MEATFEST_ANCHORS.pmbeLb * 0.60,
    pork: MEATFEST_ANCHORS.porkLb * 0.60,
    chicken: MEATFEST_ANCHORS.chickenBirds * 5 * 0.62,
    ribs: 5 * RIB_RACK_LB * 0.70,
    brats: 8 * BRAT_LINK_LB * 0.90,
  };

  return proteins.map((id) => ({
    id,
    finishedLb: (finished[id] || (eaters * Number(serving) / proteins.length)) * scale,
    mode,
    servingLb: Number(serving),
    takeRate: MEATFEST_TAKE_RATE,
    servingUnits: id === 'ribs'
      ? { takers: eaters * MEATFEST_TAKE_RATE, units: eaters * MEATFEST_TAKE_RATE * RIBS_PER_TAKER, unit: 'ribs' }
      : id === 'brats'
        ? { takers: eaters * MEATFEST_TAKE_RATE, units: eaters * MEATFEST_TAKE_RATE * 3.5, unit: 'slices' }
        : { takers: eaters * MEATFEST_TAKE_RATE },
  }));
}

export function calculateFamilyFinishedProtein(args) {
  return calculateFinishedProtein({ ...args, mode: 'family' });
}

export function calculateRawRequirement({ finishedLb, yieldRate }) {
  if (!(yieldRate > 0 && yieldRate <= 1)) throw new Error('yieldRate must be > 0 and <= 1');
  return finishedLb / yieldRate;
}

export function roundUpPurchase(requiredLb, unitWeightLb) {
  if (!(unitWeightLb > 0)) throw new Error('unitWeightLb must be > 0');
  const units = Math.max(1, Math.ceil((requiredLb - 1e-9) / unitWeightLb));
  const purchasedLb = units * unitWeightLb;
  return { units, purchasedLb, leftoverLb: Math.max(0, purchasedLb - requiredLb) };
}

export { MEATFEST_TAKE_RATE, RIBS_PER_TAKER, RIBS_PER_RACK, BRAT_LINK_LB, BRATS_PER_EATER };

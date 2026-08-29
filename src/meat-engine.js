const MEATFEST_TAKE_RATE = 0.60;
const MEATFEST_FLOOR = 0.60;
const RIBS_PER_TAKER = 1.75;
const SAUSAGE_SLICES_PER_TAKER = 3.5;

// One authoritative Meatfest rule: the 15% reduction applies to the
// overall finished-meat portion once, with a 60% floor. The resulting total
// is divided across the selected proteins. Ribs and sausage retain their
// separate count-based serving rules because they are served as pieces.
export function multiplier(proteinCount) {
  if (proteinCount < 1) return 0;
  return Math.max(MEATFEST_FLOOR, 1 - 0.15 * (proteinCount - 1));
}

export function calculateFinishedProtein({ adults = 0, kids = 0, selected, serving = 1 / 3, mode = 'meatfest' }) {
  const eaters = Number(adults) + Number(kids) * 0.5;
  const proteins = [...selected];
  if (!eaters || !proteins.length) return [];

  if (mode === 'family') {
    // Family mode keeps the selected portion as the total finished-meat
    // target and distributes that target across selected proteins.
    const finishedTotal = eaters * Number(serving);
    const perProtein = finishedTotal / proteins.length;
    return proteins.map((id) => ({ id, finishedLb: perProtein, mode, servingLb: Number(serving) }));
  }

  const finishedTotal = eaters * Number(serving) * multiplier(proteins.length);
  const finishedPerProtein = finishedTotal / proteins.length;

  return proteins.map((id) => ({
    id,
    finishedLb: finishedPerProtein,
    mode,
    servingLb: Number(serving),
    takeRate: MEATFEST_TAKE_RATE,
    servingUnits: servingUnitsFor(id, eaters),
  }));
}

function servingUnitsFor(id, eaters) {
  const takers = eaters * MEATFEST_TAKE_RATE;
  if (id === 'ribs') return { takers, units: takers * RIBS_PER_TAKER, unit: 'ribs' };
  if (id === 'brats') return { takers, units: takers * SAUSAGE_SLICES_PER_TAKER, unit: 'slices' };
  return { takers };
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

export { MEATFEST_TAKE_RATE, MEATFEST_FLOOR, RIBS_PER_TAKER, SAUSAGE_SLICES_PER_TAKER };

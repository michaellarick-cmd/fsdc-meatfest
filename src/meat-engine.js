const DISTRIBUTION_BASE = Object.freeze({
  chicken: (0.5 + 1 / 3) / 2,
  fish: 0.25,
  pork: 1 / 3,
  hog: 1 / 3,
  brats: 0.25,
  brisket: 0.5,
  pmbe: 0.5,
  prime: 0.5,
  ribs: 0.5,
  porkbelly: (1 / 3) * 0.75,
});

const MEATFEST_TAKE_RATE = 0.60;
const MEATFEST_FLOOR = 0.60;
const RIBS_PER_TAKER = 1.75;
const SAUSAGE_SLICES_PER_TAKER = 3.5;

// Meatfest rule: the selected portion is the TOTAL finished-meat target per
// adult-equivalent eater. Adding proteins reduces that total. The resulting
// total is then divided evenly across the selected proteins before each
// protein's yield and practical purchase unit are applied.
export function multiplier(proteinCount) {
  if (proteinCount < 1) return 0;
  return Math.max(MEATFEST_FLOOR, 1 - 0.15 * (proteinCount - 1));
}

export function calculateFinishedProtein({ adults = 0, kids = 0, selected, serving = 1 / 3, mode = 'meatfest' }) {
  const eaters = Number(adults) + Number(kids) * 0.5;
  const proteins = [...selected];
  if (!eaters || !proteins.length) return [];

  const bases = proteins.map((id) => {
    const base = DISTRIBUTION_BASE[id];
    if (base == null) throw new Error(`Unknown protein: ${id}`);
    return { id, base };
  });

  if (mode === 'family') {
    const baseTotal = bases.reduce((sum, row) => sum + row.base, 0);
    return bases.map(({ id, base }) => ({
      id,
      finishedLb: eaters * Number(serving) * (base / baseTotal),
      mode,
      servingLb: Number(serving),
    }));
  }

  const mult = multiplier(proteins.length);
  const totalFinished = eaters * Number(serving) * mult;
  const finishedPerProtein = totalFinished / proteins.length;

  return bases.map(({ id }) => ({
    id,
    finishedLb: finishedPerProtein,
    mode,
    servingLb: Number(serving),
    takeRate: MEATFEST_TAKE_RATE,
    servingUnits: servingUnitsFor(id, eaters),
    totalFinishedLb: totalFinished,
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

export { DISTRIBUTION_BASE, MEATFEST_TAKE_RATE, MEATFEST_FLOOR, RIBS_PER_TAKER, SAUSAGE_SLICES_PER_TAKER };

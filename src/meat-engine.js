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

// Meatfest buffet rule: each additional protein reduces the normal portion
// by 15%, with a 60% floor. The overall portion selector remains the only
// crowd-size adjustment; proteins are then converted through their own yields
// and practical purchase units.
export function multiplier(proteinCount) {
  if (proteinCount < 1) return 0;
  return Math.max(0.60, 1 - 0.15 * (proteinCount - 1));
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

  // Meatfest: total portion × buffet sampling factor. Serving format and
  // purchase-unit conversion happen downstream; do not reapply protein-specific
  // portion weights here.
  const mult = multiplier(proteins.length);
  return bases.map(({ id }) => ({
    id,
    finishedLb: eaters * Number(serving) * mult,
    mode,
    servingLb: Number(serving),
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

export { DISTRIBUTION_BASE };

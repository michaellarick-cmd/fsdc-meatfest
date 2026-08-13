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
});

const MULTIPLIERS = Object.freeze({
  '0.5': [1, 0.6, 0.376455, 0.2857, 0.25, 0.22221, 0.19442, 0.1782092],
  '0.333333': [1, 0.4, 0.25097, 0.1904667, 0.1666667, 0.14814, 0.1296133, 0.1188061],
  '0.25': [0.75, 0.3333, 0.2, 0.1667, 0.125, 0.111105, 0.0909, 0.0817429],
});

function servingKey(serving) {
  const value = Number(serving);
  if (Math.abs(value - 0.5) < 1e-6) return '0.5';
  if (Math.abs(value - 0.25) < 1e-6) return '0.25';
  return '0.333333';
}

export function multiplier(proteinCount, serving) {
  if (proteinCount < 1) return 0;
  const table = MULTIPLIERS[servingKey(serving)];
  return table[Math.max(1, Math.min(8, proteinCount)) - 1];
}

export function calculateFinishedProtein({ adults = 0, kids = 0, selected, serving = 1 / 3, mode = 'meatfest' }) {
  const eaters = Number(adults) + Number(kids) * 0.5;
  const proteins = [...selected];
  if (!eaters || !proteins.length) return [];

  const mult = multiplier(proteins.length, serving);
  return proteins.map((id) => {
    const base = DISTRIBUTION_BASE[id];
    if (base == null) throw new Error(`Unknown protein: ${id}`);
    const finished = eaters * base * mult;
    return {
      id,
      finishedLb: finished,
      mode,
      servingLb: Number(serving),
    };
  });
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

// Side planning data and calculations are kept DOM-free so CI can regression-test them.
export const sides = {
  'Asparagus': { unit: 'lb', perEater: 0.12, purchaseStep: 1 },
  'Baked Beans': { unit: 'lb', perEater: 0.20, purchaseStep: 1 },
  'Green Beans': { unit: 'lb', perEater: 0.15, purchaseStep: 1 },
  'Mac & Cheese': { unit: 'lb', perEater: 0.18, purchaseStep: 1 },
  'Pasta Salad': { unit: 'recipe', perEater: 0.04, purchaseStep: 0.5 },
  'Potato Salad': { unit: 'recipe', perEater: 0.04, purchaseStep: 0.5 }
};

export function sideQty(name, eaters) {
  const side = sides[name];
  if (!side || !Number.isFinite(eaters) || eaters <= 0) return 0;
  const raw = eaters * side.perEater;
  return side.purchaseStep ? Math.ceil(raw / side.purchaseStep) * side.purchaseStep : raw;
}

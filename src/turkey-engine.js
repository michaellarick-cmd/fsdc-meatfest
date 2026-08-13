export const TURKEY_FORMS = Object.freeze({
  whole: { yieldRate: 0.55, familyMinLb: 8, familyStepLb: 2, unit: 'whole turkey' },
  breast: { yieldRate: 0.65, familyMinLb: 3, familyStepLb: 0.5, unit: 'turkey breast' },
  legs: { yieldRate: 0.45, familyUnitLb: 0.75, unit: 'turkey leg' },
});

export function turkeyPurchase({ rawRequirementLb, form, mode = 'family' }) {
  const spec = TURKEY_FORMS[form];
  if (!spec) throw new Error(`Unknown turkey form: ${form}`);
  const raw = Number(rawRequirementLb);
  if (!(raw > 0)) throw new Error('rawRequirementLb must be > 0');

  if (form === 'legs') {
    const units = Math.max(1, Math.ceil((raw - 1e-9) / spec.familyUnitLb));
    return { units, purchasedLb: units * spec.familyUnitLb };
  }

  if (mode === 'family') {
    const units = Math.max(1, Math.ceil(Math.max(spec.familyMinLb, raw) / spec.familyStepLb));
    return { units: 1, purchasedLb: units * spec.familyStepLb };
  }

  const unitWeight = form === 'whole' ? 14 : 7;
  const units = Math.max(1, Math.ceil((raw - 1e-9) / unitWeight));
  return { units, purchasedLb: units * unitWeight };
}

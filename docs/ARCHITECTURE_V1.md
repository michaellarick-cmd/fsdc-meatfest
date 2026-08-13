# FSDC Meatfest — Architecture v1

## Status

`architecture-v1` is development work only. Production remains on v2.2.3.

The goal is to preserve the validated Meatfest behavior while separating business rules, food data, purchase units, and UI logic.

## Core modes

### Meatfest
- Preserve the current validated meat-distribution algorithm.
- Preserve current purchase-unit assumptions unless a future change is explicitly approved.
- Round purchases up to a practical purchase unit.
- Report the approximate leftover created by that rounding.
- Whole Hog is a feature protein and is not combined with other proteins.
- Hog weights above 100 lb are permitted, but the UI warns that 100 lb is approximately the practical maximum for a typical home cooker.

### Family
Family is not simply a smaller Meatfest calculation.

1. Count adults and children using the existing validated adult/child handling.
2. User chooses total **finished meat per person**:
   - `0.25 lb` — Light
   - `0.3333333333 lb` — Standard (default)
   - `0.50 lb` — Hearty
3. The portion amount is total finished protein across all selected proteins, not the amount for each protein.
4. The existing validated protein-distribution algorithm divides that total among selected proteins.
5. Convert each protein's finished requirement to raw purchase weight using that protein's yield.
6. Apply Family-specific practical purchase units.
7. Round up and report estimated leftover.

The app should describe the setting as **Portion Size**, not an FDA recommendation. FDA serving sizes describe typical consumption and are not dietary recommendations.

## Protein calculation pipeline

`people -> family portion (Family only) -> total finished meat -> validated protein distribution -> protein yield conversion -> purchase-unit rounding -> estimated leftover`

Meatfest retains its existing event-driven quantity input before the distribution step.

## Purchase-unit rule

Both modes use the same general rule:

> Calculate required quantity → round up to the next practical purchase unit → report the estimated leftover.

Leftover is a feature, not an error. It is the expected result of buying real-world units.

## Multiple proteins

Selecting more proteins does **not** multiply the per-person meat allowance. The selected proteins share the total planned finished meat.

The current validated distribution algorithm remains authoritative in both modes.

## Sides

Sides remain user-selected. No automatic side-selection redesign is planned in v1.

Sides should be represented as data with a quantity strategy:
- recipe-based
- purchase-unit based
- individual-unit based
- accompaniment/piece based

Planned additions:
- Green Beans
- Asparagus
- Potato Salad
- Pasta Salad

Potato Salad and Pasta Salad are recipe-driven: the app plans servings/recipes but does not assume a universal family recipe yield.

Fruit Salad is intentionally excluded for now because it is more of a general potluck/purchased-prepared item and adds little planning value.

## Turkey

Turkey is the only unresolved food model.

Two separate selectable proteins are required:
- Whole Turkey
- Turkey Breast

Both may be selectable in both modes. The user can select Turkey Breast when that is what is available locally. The calculator may recommend a whole bird when the calculated requirement makes a whole bird practical, but the user's explicit protein choice must be respected.

Research baseline:
- USDA Food Buying Guide: whole turkey approximately `0.42 lb cooked per 1 lb as-purchased`.
- USDA Food Buying Guide: bone-in turkey breast approximately `0.64 lb cooked per 1 lb as-purchased` with skin; `0.57` without skin.
- Butterball reports turkey breasts commonly ranging from `2.5–9 lb` and gives a general one-pound-per-person planning rule for turkey breast, which includes substantial whole-product weight rather than finished meat.

These research values are **not yet production calculation constants**. Final turkey purchase-unit rules should be validated against the same real-world BBQ purchasing philosophy used for the existing proteins.

## Data architecture

Food definitions should move out of the calculator logic into structured data. A protein definition should contain:
- id
- display name
- category
- availability by mode
- yield
- purchase unit
- typical unit weight or range
- rounding strategy
- notes/source
- optional preparation variants

A side definition should contain:
- id
- display name
- category
- quantity strategy
- base quantity
- scaling sensitivity
- rounding rule
- recipe/package metadata where applicable
- pairing/recommendation metadata

The calculation engine should consume these definitions rather than embedding food-specific constants throughout UI code.

## Production safety

`main` remains the known-good v2.2.3 baseline until the architecture branch is validated. Architecture work must not deploy automatically to the production Worker until explicitly approved.

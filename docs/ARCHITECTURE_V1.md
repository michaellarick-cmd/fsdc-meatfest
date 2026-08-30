# FSDC Meatfest — Production Architecture

## Status

Production architecture is the v2.2.x Meatfest calculator now deployed from `main`.

The priority is a small, explicit codebase with one production calculation engine. There must not be a second calculation implementation that can disagree with the browser.

## Runtime structure

### `public/index.html`
UI shell, styles, and markup.

### `public/app.js`
UI state and interaction layer. It owns guest-list handling, protein/side presentation metadata, side recommendations, and side quantity planning.

It does not own canonical Meatfest protein calculations.

### `public/meat-engine.js`
**The single production source of truth for Meatfest protein math.**

It owns:
- validated Meatfest anchors
- yields
- practical purchase units
- portion scaling
- raw-requirement calculation
- purchase rounding
- planned excess

`MeatEngine.canonicalRow()` returns the exact raw requirement separately from the rounded purchase weight. The raw requirement must remain visible in the shopping-list card.

### `public/meatfest-final.js`
Presentation layer. It gathers current UI state, calls `MeatEngine.canonicalRow()`, and renders the shopping list. It must not duplicate calculation constants or implement alternate Meatfest math.

### `test/meat-engine.test.js`
Automated regression suite. It imports the exact production browser engine rather than testing a separate `src/` implementation.

## Calculation pipeline

`adult-equivalent eaters → validated Meatfest anchor → portion scaling → exact raw requirement → practical purchase-unit rounding → planned excess`

The displayed shopping card must preserve these distinctions:

- **Finished meat needed** — cooked/finished target.
- **Raw requirement** — exact calculated raw weight before purchase rounding.
- **Purchase recommendation** — practical number of real-world units.
- **Planned excess** — difference created by purchase rounding.

A cook must be able to see the raw requirement and independently decide whether the practical purchase recommendation makes sense.

## Validated Meatfest anchors at 48 adult-equivalent eaters

- Brisket: 19.5 lb raw
- Poor Man's Burnt Ends: 16 lb raw
- Pulled Pork: 17 lb raw
- Chicken: 4 whole 5-lb fryers = 20 lb raw
- Ribs: count-based calculation using 60% takers × 1.75 ribs ÷ 11 ribs/rack
- Polish / Brats: 8 half-lb links = 4 lb raw

These are canonical planning assumptions. Changes require regression tests.

## Purchase rounding

Calculate the requirement first. Round only the purchase quantity.

Examples:

- 30 adult-equivalent eaters of whole-fryer chicken → **12.5 lb raw requirement** → 2.5 birds required → **3 birds / 15 lb purchase** → 2.5 lb planned excess.
- 48 adult-equivalent eaters of chicken → **20 lb raw requirement** → **4 × 5-lb birds**.

The UI must never hide the first number merely because the second number is easier to shop for.

## Modes

Meatfest and Family are separate planning models. Family mode may use a user-selected finished-meat portion, but it must not silently alter the validated Meatfest anchors.

## Cleanup rule

The repository should contain one production calculation implementation. Old engines, duplicate regression suites, research-only runtime code, and unused development catalogs should be removed rather than retained as compatibility layers.

## Deployment safety

GitHub Actions must run the regression suite before deploying `public/` to the Cloudflare Worker. A successful deployment is not sufficient by itself; the deployed browser must be verified against the production engine behavior.

# FSDC Meatfest Calculator

## Purpose
The Meatfest calculator is the source of truth for planning Labor Day Meatfest quantities. Meatfest and Family modes remain separate planning models.

## Architecture
- `public/index.html` — UI shell, styles, and markup.
- `public/app.js` — UI state, protein/side presentation metadata, guest-list handling, and side planning.
- `public/meat-engine.js` — **single production calculation engine and single source of truth for Meatfest protein math**.
- `public/meatfest-final.js` — presentation layer that calls `MeatEngine.canonicalRow()` and renders the results.
- `test/meat-engine.test.js` — automated tests that load the exact production engine from `public/meat-engine.js`.
- `worker.js` — Cloudflare runtime wrapper and cache-control policy.
- `public/sw.js` — cache cleanup/unregistration service worker.

There is intentionally no second calculation engine under `src/`. Research-only turkey calculation code and the unused development protein catalog have been removed from the production repository.

## Calculation rules that must not regress
1. Meatfest protein quantities are based on validated Meatfest anchors, not equal-share math across selected proteins.
2. Finished-meat need, exact raw requirement, and practical purchase quantity are separate values.
3. The exact raw requirement is calculated before purchase-unit rounding and is displayed to the cook.
4. Purchase recommendations round up to practical units but never replace the underlying raw requirement.
5. Portion selection scales the Meatfest anchors.
6. Family mode remains isolated from Meatfest-specific anchors.
7. Any change to canonical quantity or purchase logic requires a regression test against the production engine.

## Deployment
GitHub Actions runs the test suite before deploying `public/` assets to the Cloudflare Worker `fsdc-meatfest`.

Required GitHub repository secrets:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Credentials must never be committed to source files.

<!-- trigger -->

# FSDC Meatfest Calculator

## Purpose
The Meatfest calculator is the source of truth for planning Labor Day Meatfest quantities. Meatfest and Family modes use separate calculation paths.

## Architecture
- `public/index.html` — UI shell and presentation.
- `public/meatfest-final.js` — authoritative Meatfest runtime calculator.
- `src/meat-engine.js` — tested calculation engine and regression reference.
- `src/turkey-engine.js` — turkey calculation engine.
- `data/` — versioned protein and side data.
- `test/` — automated regression tests, including the canonical Meatfest scenario.
- `worker.js` — Cloudflare runtime wrapper and cache-control policy.
- `public/sw.js` — browser service worker with versioned cache.

## Calculation rules that must not regress
1. Meatfest protein quantities are based on validated Meatfest anchors, not equal-share math across selected proteins.
2. Finished-meat need, raw requirement, and practical purchase quantity are separate values.
3. Raw requirement is calculated before purchase-unit rounding and must remain visible to the cook.
4. Purchase recommendations round up to practical units but never replace the underlying raw requirement.
5. Portion selection scales the Meatfest anchors.
6. Family mode must remain isolated from Meatfest-specific anchors.
7. Any change to a canonical quantity requires a regression test.

## Deployment
GitHub Actions runs the test suite before deploying `public/` assets to the Cloudflare Worker `fsdc-meatfest`.

Required GitHub repository secrets:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Credentials must never be committed to source files.

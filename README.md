# FSDC Meatfest Calculator

Stable baseline migrated from deployed **v2.2.3** Meatfest calculator.

## Baseline
- Version: 2.2.3
- Meatfest mode remains the default.
- Family mode is included.
- Family ribs use half-rack purchase increments.
- This repository is the source of truth for future architecture work.

## Deployment
GitHub Actions is configured to deploy the `public/` static assets to the Cloudflare Worker `fsdc-meatfest`.

Required GitHub repository secrets:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Do not put either credential in source files.

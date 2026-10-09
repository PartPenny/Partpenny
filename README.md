# PartPenny V3.5 — honest comparison improvements

## Deploy order
1. Cloudflare Workers & Pages → existing PartPenny Worker → Edit Code: replace all code with `cloudflare-worker.js` and deploy. The Worker should return `version: 3.5` at its root URL.
2. GitHub repo `partpenny/Partpenny`: replace the root `index.html` with the supplied file and commit. Do not upload the ZIP itself.
3. Open https://partpenny.github.io/Partpenny/ and hard-refresh (Ctrl+Shift+R).

## Changes
- Catalog prices sorted ascending **within each currency**. CAD and USD are not falsely compared.
- More explicit source failures and incomplete catalog pagination warnings.
- Clear warnings that listed prices exclude unknown delivery, taxes, and possible core deposits.
- Added direct AutoZone and NAPA search destinations for common mechanical parts alongside RockAuto and Car-Part.com. These are retailer **links**, not live pricing integrations.
- Worker input and condition validation; existing Putco and Eskimo logic retained.

## Smoke tests
- 2024 Ford Ranger / tailgate light bar / All conditions: Putco prices may appear.
- 2015 Ford F-150 / engine / All conditions: Eskimo CAD engine price may appear.
- 2015 Ford F-150 / alternator / All conditions: no fabricated price; retailer links available.
- Used condition on a Putco-only accessory: no misleading New price.

## Limitations
No authorized, no-account live price feed for common mechanical parts was verified. Retailer links are not scraped. Product fitment and final checkout costs remain unverified. Do not claim nationwide cheapest pricing.

# PartPenny V3.3 — Combined vehicle details + first catalog integration

## Important
This includes V3.2 trim/engine improvements. Do not install V3.2 separately.

## Installation (two deployments)
1. Cloudflare Dashboard → your `partpenny` Worker → Edit code: replace the current code with `cloudflare-worker.js`, then Deploy.
2. Test `/` (version 3.3) and `/api/search?year=2013&make=Toyota&model=Avalon&part=engine`.
3. In GitHub `Partpenny`, replace `index.html` with this ZIP's version and commit.
4. Refresh the GitHub Pages website and test.

## Limitations
- Public catalog is Eskimo Auto & Truck Parts' remanufactured engines only; CAD prices.
- First 500 catalog rows searched; pagination may include more.
- Catalog field mappings are defensive but have not been validated against a live Cloudflare deployment. If no matches appear, inspect the catalog schema before modifying mapping.
- No verified fitment or stock, no USD conversion, no shipping/tax/core total, and no confirmed lowest available price. The UI separates catalog candidates from verified listings.
- Manufacturer/model suggestions use NHTSA. Trim and engine suggestions use saved vehicles or VIN decoding when available, not a comprehensive catalog.
- Do not put API secrets in GitHub. No credentials needed for this public catalog.

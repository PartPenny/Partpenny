# PartPenny V3.4

## Deploy in order
1. Cloudflare dashboard > Workers & Pages > existing PartPenny Worker > Edit code. Replace its entire script with `cloudflare-worker.js`, then **Deploy**. Keep the existing Worker URL.
2. Test `/` and `/api/search?year=2024&make=Ford&model=Ranger&part=LED%20tailgate%20light%20bar&condition=new`. Results depend on live Putco catalog and vehicle applications.
3. GitHub repo `partpenny/Partpenny`: replace root `index.html` with this file and commit. Keep GitHub Pages configuration unchanged.

## Notes
- Putco: officially documented public AI integration API, new truck accessories; year/make/model matches with configuration restrictions, not guaranteed exact trim fitment.
- Eskimo: remanufactured engine catalog; CAD reference prices, fitment and stock unverified.
- Mechanical parts: direct search links only until an authorized pricing source is available. No invented prices.
- No API key, paid service, or additional account required.
- Published prices are not total delivered prices; no cross-currency cheapest claim.
- Existing make/model autocomplete and saved garage preserved.

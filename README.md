# PartPenny V3 — Smart Vehicle Selection

Upload `index.html` to the root of your existing GitHub Pages `Partpenny` repository. No changes to your deployed Cloudflare Worker are needed for this version.

## New
- Manufacturer suggestions backed by the free NHTSA vPIC car-makes API (type T for matching options in the browser datalist).
- Model suggestions for the chosen year and make, via NHTSA vPIC.
- Optional trim and engine fields; **no invented trim catalog**.
- Optional 17-character VIN decode to populate fields when available.
- Existing My Garage, seller search links, and Cloudflare API connection retained.
- Fixed a missing semicolon in the previous version's API request JavaScript.

## Limitations
- NHTSA does not provide a complete year-specific trim catalog or a parts fitment database. Trim is manually entered unless VIN decode supplies it.
- Some makes/models (including trucks/SUVs) may be missing because the current catalog query is restricted to the passenger-car vehicle type.
- The Cloudflare Worker currently has zero live retail integrations, so it cannot rank real prices yet.
- API requests depend on NHTSA uptime and browser network access.

## Test
1. Choose 2013, type `T` in Make, choose Toyota from browser suggestions.
2. Enter Avalon in Model and check suggestions.
3. Optionally enter trim and engine, then search for Alternator.
4. Confirm the Cloudflare API returns zero retailer sources (expected).
5. Save and restore a garage vehicle.

NHTSA API: https://vpic.nhtsa.dot.gov/api/

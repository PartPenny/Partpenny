# PartPenny V2 — comparison engine foundation

This version retains V1 vehicle search and saved garage, and adds an actual-listing results renderer. **It does not provide live prices without an authorized inventory API.** It never fabricates prices.

## Run
Open `index.html` or publish to GitHub Pages. Without a backend, search results display clearly labeled links to retailers and salvage sites.

## Connect an authorized comparison API
In the browser developer console, configure a backend URL (only use a trusted endpoint):

`localStorage.setItem('partpenny-api-url', 'https://YOUR-API-HOST.example')`

The frontend sends GET `/api/search` with query parameters `year`, `make`, `model`, `engine`, `part`, `zip`, `condition`, and `radius`. Backend must enable CORS for the frontend origin.

Expected JSON: `{ "listings": [{"seller":"Example","title":"Part title","condition":"used","location":"Online","shippingLabel":"$8 shipping","totalPrice":72.00,"taxIncluded":false,"fitment":"verified","availability":"in_stock","url":"https://seller.example/item"}] }`

Only records with `fitment: verified`, `availability: in_stock`, valid nonnegative `totalPrice`, and HTTPS URL are displayed. The backend is responsible for validating genuine availability, vehicle fitment, tax/shipping/core charges, and retailer authorization. No provider credentials should be placed in the static site. If shipping or fees cannot be determined, the backend should not label `totalPrice` as complete.

## Next milestone
Secure legitimate inventory access (e.g. approved marketplace developer API), build the backend, validate fitment and cost fields, and test live search. No real retailer API access is included in this ZIP.

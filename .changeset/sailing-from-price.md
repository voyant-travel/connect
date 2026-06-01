---
"@voyantjs/connect-cruises": patch
---

Carry the sailing "from" price onto the sailing entry. `toSailing` now maps the sailing row's `priceFromAmountMinor` (the platform's rollup-computed cheapest bookable price, already returned by the sailing list/read endpoints) onto `lowestPriceCents`. Departure prices in the cruise content / sailing list no longer require a separate `fetchSailingPricing` call per sailing.

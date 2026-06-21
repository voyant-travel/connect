---
"@voyant-travel/connect-adapter": patch
---

Fix Connect-backed cruise content dropping cabin categories and "from" prices.

- `getContent` now falls back from a regional locale (e.g. `en-GB`) to its
  language locale (`en`) and then to no locale when listing a ship's cabin
  categories, so regional requests no longer suppress cabin data that Connect
  only populates under the language locale.
- Sailing rows that carry no `priceFrom`/`lowestPrice` summary now derive a
  lowest-price summary from the cheapest available pricing row returned by
  `listSailingPricing`, so consumers stop showing blank `From` prices when
  Connect has pricing data.

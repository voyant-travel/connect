---
"@voyantjs/connect-cruises": minor
---

Populate the cruise search-projection entry's supplier/ship ids, status, price, and cover image, and read camelCase catalog-projection geography. `toSearchProjection` / `toSummary` now emit `lineExternalId` / `shipExternalId` (so catalog field policies can bind supplier/ship columns to ids, not just names), `salesStatus` from the cruise's `status` (previously hardcoded `null`), `lowestPrice` / `lowestPriceCurrency` from `priceFromAmountMinor`, `shipName` from the resolved projection (falling back to the external id), and `heroImageUrl` from the cover media instead of the absent `payload.heroImageUrl`. Geography reads prefer the v2 camelCase projection keys (`regionIds` / `waterwayIds` / `portIds` / `countryIso`) and fall back to the legacy snake_case keys.

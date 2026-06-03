# @voyantjs/connect-cruises

## 0.3.5

### Patch Changes

- Updated dependencies [4733680]
  - @voyantjs/connect-sdk@0.2.0

## 0.3.4

### Patch Changes

- 5987437: Surface the rich cabin + ship fields the catalog now carries. `toCabinCategory` reads `gradeCodes` (the booking/pricing grades that roll up to one bookable category), `wheelchairAccessible`, and `roomLayoutImages` (floor plans, distinct from the photo gallery); `toShip` reads `description`, `deckPlanUrl`, and `decks`. The `ConnectExternalCabinCategory` and `ConnectExternalShip` types gain the corresponding fields. All optional — providers that omit them are unaffected.

## 0.3.3

### Patch Changes

- 2919ca8: Read itinerary day descriptions + times from `payload`. `fetchSailingItinerary` substituted the port `title` for each day's `description` (so days repeated the port name and the real narrative was dropped) and hardcoded `arrivalTime`/`departureTime` to null. It now reads `payload.description` and the row's `arriveAt`/`departAt`.
- d9a58cf: Carry the sailing "from" price onto the sailing entry. `toSailing` now maps the sailing row's `priceFromAmountMinor` (the platform's rollup-computed cheapest bookable price, already returned by the sailing list/read endpoints) onto `lowestPriceCents`. Departure prices in the cruise content / sailing list no longer require a separate `fetchSailingPricing` call per sailing.

## 0.3.2

### Patch Changes

- 1943108: Attach cabin categories in `fetchShip`. The ship read doesn't include cabin categories, so the cruise content's "Options" tab (and cabin pricing) had no catalog to bind. `fetchShip` now also calls `client.cruises.listCabinCategories` and attaches the mapped rows as `ship.categories`. Adds the `ConnectExternalCabinCategory` type + the ship `categories` field and a `toCabinCategory` mapper (code/name/roomType/occupancy/area/features/images, normalizing the room type — `studio` → `single`).

## 0.3.1

### Patch Changes

- 3cc609c: Fix the cruise detail mappers to read rich content from `payload`. The cruise read endpoint returns the row with structural columns top-level but description, highlights, ports, and media under `payload`; `toCruise` was reading the top-level keys (and `shipId` instead of `shipExternalId`), so `fetchCruise` returned an empty description, no highlights, and a null `defaultShipRef` — which made the content path skip the ship and cabin categories. `toCruise` now reads `payload.*` with column fallbacks and uses `shipExternalId` for the ship ref; `toShip` reads its gallery from `payload.images[].url`; and `toSailing` reads port names from the payload. Mirrors the same fix applied to `toSearchProjection`.

## 0.3.0

### Minor Changes

- 48b8b5c: Populate the cruise search-projection entry's supplier/ship ids, status, price, and cover image, and read camelCase catalog-projection geography. `toSearchProjection` / `toSummary` now emit `lineExternalId` / `shipExternalId` (so catalog field policies can bind supplier/ship columns to ids, not just names), `salesStatus` from the cruise's `status` (previously hardcoded `null`), `lowestPrice` / `lowestPriceCurrency` from `priceFromAmountMinor`, `shipName` from the resolved projection (falling back to the external id), and `heroImageUrl` from the cover media instead of the absent `payload.heroImageUrl`. Geography reads prefer the v2 camelCase projection keys (`regionIds` / `waterwayIds` / `portIds` / `countryIso`) and fall back to the legacy snake_case keys.

## 0.2.0

### Minor Changes

- 6420216: Carry canonical geography from the catalog projection onto the cruise search-projection entry. `toSearchProjection` now lifts `region_ids` / `waterway_ids` / `port_ids` / `country_iso` (canonical data-geo ids) and the parallel `waterways` / `ports` / `countries` name arrays off `OperatorCruiseSummary.projection`, so downstream catalog adapters can index them for cross-provider destination faceting. Fields are omitted when the projection has no resolved geography.

## 0.1.7

### Patch Changes

- Updated dependencies [9f31956]
  - @voyantjs/connect-sdk@0.1.6

## 0.1.6

### Patch Changes

- f4e8e75: Upgrade Voyant framework package peers and dev installs to the latest 0.85.3 line.

## 0.1.5

### Patch Changes

- Updated dependencies [10d4451]
  - @voyantjs/connect-sdk@0.1.5

## 0.1.4

### Patch Changes

- Updated dependencies [306b849]
  - @voyantjs/connect-sdk@0.1.4

## 0.1.3

### Patch Changes

- Updated dependencies [9825584]
  - @voyantjs/connect-sdk@0.1.3

## 0.1.2

### Patch Changes

- Updated dependencies [e267f77]
  - @voyantjs/connect-sdk@0.1.2

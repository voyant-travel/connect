---
"@voyantjs/connect-cruises": patch
---

Fix the cruise detail mappers to read rich content from `payload`. The cruise read endpoint returns the row with structural columns top-level but description, highlights, ports, and media under `payload`; `toCruise` was reading the top-level keys (and `shipId` instead of `shipExternalId`), so `fetchCruise` returned an empty description, no highlights, and a null `defaultShipRef` — which made the content path skip the ship and cabin categories. `toCruise` now reads `payload.*` with column fallbacks and uses `shipExternalId` for the ship ref; `toShip` reads its gallery from `payload.images[].url`; and `toSailing` reads port names from the payload. Mirrors the same fix applied to `toSearchProjection`.

`fetchShip` now also fetches the ship's cabin categories (`client.cruises.listCabinCategories`) and attaches them as `ship.categories`, so the content's cabin categories (the "Options" tab) and cabin pricing have a catalog to bind. Adds `ConnectExternalCabinCategory` + the ship `categories` field.

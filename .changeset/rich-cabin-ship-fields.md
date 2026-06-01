---
"@voyantjs/connect-cruises": patch
---

Surface the rich cabin + ship fields the catalog now carries. `toCabinCategory` reads `gradeCodes` (the booking/pricing grades that roll up to one bookable category), `wheelchairAccessible`, and `roomLayoutImages` (floor plans, distinct from the photo gallery); `toShip` reads `description`, `deckPlanUrl`, and `decks`. The `ConnectExternalCabinCategory` and `ConnectExternalShip` types gain the corresponding fields. All optional — providers that omit them are unaffected.

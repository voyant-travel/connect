---
"@voyantjs/connect-sdk": minor
---

Align the `AccommodationContent` types with the canonical `accommodationContentSchema` in the server-side contract, so the SDK mirror has one source of truth instead of a hand-kept copy that can silently drift:

- `AccommodationContentMedia` gains `copyright` and its `rel` now includes `LOGO` — it mirrors the contract `Media` primitive.
- `AccommodationContentFeatureType` widens to the full feature-role vocabulary, and `AccommodationContentFeature.shortDescription` is now nullable (it reuses the contract `Feature`).
- `identifiers` is now the full place-identifier set via the new `AccommodationContentIdentifiers` export (google/apple/tripadvisor/yelp/facebook/foursquare/baidu/amap), not just `tripadvisorLocationId`.

These are widening/additive changes to read models. Suppliers populate the slots they have and leave the rest `null`; emitting connectors will be updated to fill `copyright` and the full identifier set.

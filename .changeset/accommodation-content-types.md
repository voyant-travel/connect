---
"@voyantjs/connect-sdk": minor
---

Surface rich accommodation content in the SDK.

- `OperatorAccommodationDetail` now includes `content: AccommodationContent | null` — the localized descriptions, facilities, gallery, rooms, and reviews returned by the operator accommodation detail endpoint. Supporting types are exported: `AccommodationContent`, `AccommodationContentSection`, `AccommodationContentFeature`, `AccommodationContentFeatureType`, `AccommodationContentMedia`, `AccommodationContentRoom`, `AccommodationContentReviews`, `AccommodationContentReviewSubrating`. Pass `locale` to `accommodations.get(...)` to request a language (falls back to any synced locale).
- Add `connections.triggerContentSync(operatorId, connectionId)` to force an out-of-band refresh of that content (mirrors `triggerProjectionSync`).

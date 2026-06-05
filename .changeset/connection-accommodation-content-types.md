---
"@voyantjs/connect-sdk": minor
---

Type the per-connection accommodation endpoints. `accommodations.getOnConnection(...)` now returns `ConnectionAccommodationDetail` (the synced accommodation columns plus `content: AccommodationContent | null` — the rich, localized detail-page content), and `accommodations.listOnConnection(...)` returns `ConnectionAccommodation[]` instead of `JsonObject`/`JsonObject[]`. Both new types are exported. Pass `locale` to request a language (falls back to any synced locale).

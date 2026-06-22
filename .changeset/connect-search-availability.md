---
"@voyant-travel/connect-adapter": minor
---

Implement `searchAvailability` on the Voyant Connect `SourceAdapter` (dynamic-packaging, voyant#2093). The adapter now declares `supportsAvailabilitySearch` and maps the vertical-agnostic catalog `AvailabilitySearchRequest` onto Connect's stay search (`client.stays.search`), normalizing each `StayOffer` into a catalog `AvailabilityCandidate`:

- `candidateRef`/`entity_id`/`selection` from the offer; per-offer `source.connectionId` so a cross-provider result routes each candidate back to the right connection at reserve.
- `price` from `totals.total` with an exact `ConnectMoney` minor-units → decimal-string conversion (no float drift).
- the full `StayOffer` round-tripped in `providerData` (needed for `stays.lock`); kept internal, never public.
- non-accommodation verticals report `status: "unsupported"`.

A `searchAvailability` override hook is added to `VoyantConnectSourceAdapterOptions`, mirroring `liveResolve`/`reserve`. Requires `@voyant-travel/catalog` ≥ 0.130.0 (carries the `searchAvailability` contract); the dependency pin is bumped accordingly.

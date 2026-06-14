# @voyant-travel/connect-sdk

## 0.8.0

### Minor Changes

- 5ca6297: Align the `AccommodationContent` types with the canonical `accommodationContentSchema` in the server-side contract, so the SDK mirror has one source of truth instead of a hand-kept copy that can silently drift:
  - `AccommodationContentMedia` gains `copyright` and its `rel` now includes `LOGO` — it mirrors the contract `Media` primitive.
  - `AccommodationContentFeatureType` widens to the full feature-role vocabulary, and `AccommodationContentFeature.shortDescription` is now nullable (it reuses the contract `Feature`).
  - `identifiers` is now the full place-identifier set via the new `AccommodationContentIdentifiers` export (google/apple/tripadvisor/yelp/facebook/foursquare/baidu/amap), not just `tripadvisorLocationId`.

  These are widening/additive changes to read models. Suppliers populate the slots they have and leave the rest `null`; emitting connectors will be updated to fill `copyright` and the full identifier set.

## 0.7.1

### Patch Changes

- 65083c9: Clarify that `accommodations.get(...)` (operator-scoped) takes the internal id only — a provider externalId isn't unique across an operator's connections. Resolve an externalId via `accommodations.list({ externalId })` or the connection-scoped `getOnConnection`, both of which still accept it.

## 0.7.0

### Minor Changes

- 9d32125: Look up accommodations by provider externalId, not just the internal id. `ListAccommodationsQuery` gains an `externalId?: string | string[]` filter (resolve provider hotel codes like TUI `AGP28009` → catalog rows), and `accommodations.get(...)` / `accommodations.getOnConnection(...)` now accept either the internal `csac_…` id or the externalId for the path identifier. Removes the dead-end where you had an externalId but every detail path required the internal id.

## 0.6.0

### Minor Changes

- dbc5975: Type the per-connection accommodation endpoints. `accommodations.getOnConnection(...)` now returns `ConnectionAccommodationDetail` (the synced accommodation columns plus `content: AccommodationContent | null` — the rich, localized detail-page content), and `accommodations.listOnConnection(...)` returns `ConnectionAccommodation[]` instead of `JsonObject`/`JsonObject[]`. Both new types are exported. Pass `locale` to request a language (falls back to any synced locale).

## 0.5.0

### Minor Changes

- 54c4827: Surface rich accommodation content in the SDK.
  - `OperatorAccommodationDetail` now includes `content: AccommodationContent | null` — the localized descriptions, facilities, gallery, rooms, and reviews returned by the operator accommodation detail endpoint. Supporting types are exported: `AccommodationContent`, `AccommodationContentSection`, `AccommodationContentFeature`, `AccommodationContentFeatureType`, `AccommodationContentMedia`, `AccommodationContentRoom`, `AccommodationContentReviews`, `AccommodationContentReviewSubrating`. Pass `locale` to `accommodations.get(...)` to request a language (falls back to any synced locale).
  - Add `connections.triggerContentSync(operatorId, connectionId)` to force an out-of-band refresh of that content (mirrors `triggerProjectionSync`).

## 0.4.0

### Minor Changes

- 53f7d10: Add a typed `client.packages` domain mirroring `client.stays` — `search` / `searchAcrossProviders` (offers + per-connection diagnostics), `lock` / `releaseLock` / `getHold`, and `confirm` / `cancel` / `get` / `list` / `listAll`. Callers no longer drop to raw `transport.request` for the package (flight + stay) data plane. A canonical `destination.countryCode`/`region`/`city` is resolved to the supplier's accommodations server-side, keeping callers on one model across providers.

  Also surface the canonical failure classification — `ConnectionDiagnostic.code` and `StaySearchResponse.errorCode` / `PackageSearchResponse.errorCode` (e.g. `PROVIDER_REJECTED_REQUEST`, `UNSUPPORTED_OPERATION`, `UPSTREAM_UNAVAILABLE`) — so callers can branch on the failure class without parsing messages.

  Internal: the route-parity tooling now syncs `packages.ts` and excludes the internal connector self-registration route (`PUT /connect/v1/connector-providers/:key/manifest`) from the public manifest, so `pnpm verify` is fully green.

## 0.3.2

### Patch Changes

- 3a4f807: Add `supplyModel` to `SearchDocument` (and carry it through the connect-adapter catalog projection), mirroring the platform's first-class facet. `supplyModel` is the supply-model mechanic a catalog surface forks on — `dynamic` (composed-live, any-date, calendar pricing) vs `scheduled` (dated departures/slots with an allotment) — so consumers can split the catalog into search-first vs browse-departures surfaces. Product _type_ stays in `category`.

## 0.3.1

### Patch Changes

- 2e53c08: Add `board` + `stars` facets to `SearchDocument` (and carry them through the connect-adapter catalog projection), mirroring the platform's first-class filter facets so consumers can build/apply board-basis and star-rating filters.

## 0.3.0

### Minor Changes

- ccd65a5: Add the `PackageHold` contract type (+ `PackageHoldStatus`) — the Connect-side hold over a `PackageOffer`, mirroring `StayHold`. Returned by the package lock route; Connect always materialises a hold before confirm (binding `PackageConfirmInput.holdId`).

## 0.2.0

### Minor Changes

- 4733680: Add the packages (composed flight + stay) data plane.
  - `@voyant-travel/connect-sdk`: new `Package*` contract types — `PackageOffer`, `PackageBooking`, `PackageSearchQuery`/`PackageSearchResponse`, `PackageConfirmInput`, `StayComponent`, `FlightSegment`, `ComponentRef`, `PackagePricing`, and a canonical `Traveler` (category + PII + optional sex).
  - `@voyant-travel/connect-provider-sdk`: extend the hosted-worker protocol with the package operations — `searchPackages`, `lockPackage`, `confirmPackage`, `cancelPackage`, `getPackageBooking` (→ `/packages/*`), alongside the existing cruise + stays operations. Protocol version unchanged.

## 0.1.6

### Patch Changes

- 9f31956: Expose cruise sailing promotions and enriched sailing pricing fields in the Connect SDK.

## 0.1.5

### Patch Changes

- 10d4451: Expose cruise price-from fields on operator cruise summaries and normalize sailing price-from values from canonical Connect price columns.

## 0.1.4

### Patch Changes

- 306b849: Expose canonical cruise projection/provenance fields on Connect cruise rows and prefer those fields when normalizing adapter cruise content.

## 0.1.3

### Patch Changes

- 9825584: Preserve the global fetch receiver in the default transport path so Worker-style runtimes do not require callers to pass a bound fetch.

## 0.1.2

### Patch Changes

- e267f77: Support live Connect search document rows that are returned as flat API records instead of `payload`-wrapped records.

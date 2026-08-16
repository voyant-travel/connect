# @voyant-travel/connect-adapter

## 0.6.2

### Patch Changes

- ff5d738: Read cruise sea days and ship media from the shapes Connect actually stores.

  `is_at_sea` fell back to `getString(day, "portName") === undefined`, but no
  stored itinerary row carries a `portName` key — the sailing payload uses
  `title` and the itinerary table uses `port_name`. Every day of every sourced
  cruise therefore reported "at sea" while displaying a real port name beside it.
  It now reads `isSeaDay` / `is_sea_day` / `is_at_sea` and only falls back to
  "there is no port name at all".

  `toCruiseContentShip` also dropped the ship type and every image, so a ship with
  a photo rendered as a bare name. It now emits `ship_type`, `gallery` and
  `deck_plans`, accepting the media shapes connectors emit (string arrays,
  `{ url }` objects, or a single URL string).

## 0.6.1

### Patch Changes

- 55c5acc: Resolve cruises keyed by an encoded SourceRef.

  The catalog keys sourced cruises as `crus_sr_<base64url(JSON)>`, but the
  adapter only understood the legacy `cruise:<externalId>:<locale>` form. No
  candidate ever reduced to the upstream external id, so the per-id lookup 404'd,
  the fallback list scan matched nothing, and `getContent` threw
  `Connect cruise content not found` — surfacing as a 500 on every sourced cruise
  detail read, admin and storefront. Encoded keys are now decoded to the external
  id before any lookup.

## 0.6.0

### Minor Changes

- 1090d5f: Depend on the dependency-light `*-contracts` packages instead of the framework
  runtime packages, per ADR-0002.

  `connect-adapter` now peer-depends on `@voyant-travel/catalog-contracts` rather
  than `@voyant-travel/catalog`; it only ever imported the source-adapter contract
  and provenance surfaces, which the runtime package merely re-exports.

  `connect-cruises` drops its `@voyant-travel/cruises` peer dependency entirely —
  nothing in the package imported it.

  `plugin-voyant-connect` sources its contract types from
  `@voyant-travel/catalog-contracts` and `@voyant-travel/cruises-contracts`. It
  keeps its `@voyant-travel/catalog` and `@voyant-travel/cruises` peers because it
  uses runtime values from both (`SourceAdapterRegistry` from
  `catalog/booking-engine`, and `memoizeCruiseAdapter`).

### Patch Changes

- c92d083: Widen the `catalog-contracts` peer to the range that actually compiles.

  `^0.112.2` on a 0.x means `>=0.112.2 <0.113.0`. Building the adapter against
  each published minor shows `0.113.0` compiles and `0.114.0` does not —
  `GetReservationResult.upstream_ref` became required while the request field
  became optional — so the supported window is `>=0.112.2 <0.114.0`.

  This is a correction, not a catch-up. `catalog-contracts` is at `0.117.1`; the
  adapter is three breaking minors behind it and no range change closes that gap.
  Supporting `>=0.114.0` needs the reservation-lookup contract change
  implemented, which is tracked separately.

- 3edee9f: Move Voyant development dependencies to the current published contract and runtime lines, and constrain pre-1.0 peers to those compatible minor lines so future breaking minors produce an install-time incompatibility instead of silently matching.

## 0.5.0

### Minor Changes

- 50f382f: Add the packages route to the generic Connect source adapter. Sourced package
  products (e.g. TUI flight+hotel packages) previously fell through liveResolve
  to the availability path — which the packages data plane cannot serve — so
  every quote failed. The adapter now routes package-shaped quotes (departure
  date + roomTypeId/ratePlanId/board pin, no rooms[]/departure slot) through
  `packages.search`, pins the operator's room/board choice on the offer's stay
  component, and emits the flat pricing fields the catalog quote engine reads.
  Booking follow-through gains the matching branches: `connectRoute: "packages"`
  reserve via `packages.confirm`, plus cancel/status for `package:` upstream
  refs.

### Patch Changes

- Updated dependencies [c256cfc]
  - @voyant-travel/connect-sdk@0.10.0

## 0.4.0

### Minor Changes

- 909e371: Implement `searchAvailability` on the Voyant Connect `SourceAdapter` (dynamic-packaging, voyant#2093). The adapter now declares `supportsAvailabilitySearch` and maps the vertical-agnostic catalog `AvailabilitySearchRequest` onto Connect's stay search (`client.stays.search`), normalizing each `StayOffer` into a catalog `AvailabilityCandidate`:
  - `candidateRef`/`entity_id`/`selection` from the offer; per-offer `source.connectionId` so a cross-provider result routes each candidate back to the right connection at reserve.
  - `price` from `totals.total` with an exact `ConnectMoney` minor-units → decimal-string conversion (no float drift).
  - the full `StayOffer` round-tripped in `providerData` (needed for `stays.lock`); kept internal, never public.
  - non-accommodation verticals report `status: "unsupported"`.

  A `searchAvailability` override hook is added to `VoyantConnectSourceAdapterOptions`, mirroring `liveResolve`/`reserve`. Requires `@voyant-travel/catalog` ≥ 0.130.0 (carries the `searchAvailability` contract); the dependency pin is bumped accordingly.

## 0.3.2

### Patch Changes

- 0130564: Relicense the public Connect packages from `FSL-1.1-Apache-2.0` to `Apache-2.0`.
  The root `LICENSE` is replaced with the standard Apache License 2.0 text.
- Updated dependencies [0130564]
  - @voyant-travel/connect-sdk@0.9.1

## 0.3.1

### Patch Changes

- 6b436a2: Fix Connect-backed cruise content dropping cabin categories and "from" prices.
  - `getContent` now falls back from a regional locale (e.g. `en-GB`) to its
    language locale (`en`) and then to no locale when listing a ship's cabin
    categories, so regional requests no longer suppress cabin data that Connect
    only populates under the language locale.
  - Sailing rows that carry no `priceFrom`/`lowestPrice` summary now derive a
    lowest-price summary from the cheapest available pricing row returned by
    `listSailingPricing`, so consumers stop showing blank `From` prices when
    Connect has pricing data.

## 0.3.0

### Minor Changes

- ceab4b0: Rename the npm scope from `@voyantjs` to `@voyant-travel` to match the renamed
  org. All packages, imports, repository/homepage URLs, and the default API base
  URL (`api.voyantjs.com` → `api.voyant.travel`) are updated. Consumers must update
  their dependencies to the `@voyant-travel/*` scope and re-point any pinned
  `@voyantjs/connect-*` imports.

### Patch Changes

- Updated dependencies [ceab4b0]
  - @voyant-travel/connect-sdk@0.9.0

## 0.2.22

### Patch Changes

- Updated dependencies [5ca6297]
  - @voyant-travel/connect-sdk@0.8.0

## 0.2.21

### Patch Changes

- 5d85630: `liveResolve` for stays now pins the resolved offer to a caller-supplied `roomTypeId` / `ratePlanId` (or `board`) when present. A date with several boards/rates returns several offers per accommodation; the resolver previously kept whichever offer came last in the search response, so the exact board/room the operator clicked wasn't guaranteed to be the one quoted. Selection is now deterministic per accommodation — the pinned offer when matched, otherwise the first candidate. Absent a pin, behaviour is unchanged (the stay `offer.id` is a per-search token and can't pin across the re-resolve).

## 0.2.20

### Patch Changes

- Updated dependencies [65083c9]
  - @voyant-travel/connect-sdk@0.7.1

## 0.2.19

### Patch Changes

- Updated dependencies [9d32125]
  - @voyant-travel/connect-sdk@0.7.0

## 0.2.18

### Patch Changes

- Updated dependencies [dbc5975]
  - @voyant-travel/connect-sdk@0.6.0

## 0.2.17

### Patch Changes

- Updated dependencies [54c4827]
  - @voyant-travel/connect-sdk@0.5.0

## 0.2.16

### Patch Changes

- Updated dependencies [53f7d10]
  - @voyant-travel/connect-sdk@0.4.0

## 0.2.15

### Patch Changes

- 3a4f807: Add `supplyModel` to `SearchDocument` (and carry it through the connect-adapter catalog projection), mirroring the platform's first-class facet. `supplyModel` is the supply-model mechanic a catalog surface forks on — `dynamic` (composed-live, any-date, calendar pricing) vs `scheduled` (dated departures/slots with an allotment) — so consumers can split the catalog into search-first vs browse-departures surfaces. Product _type_ stays in `category`.
- Updated dependencies [3a4f807]
  - @voyant-travel/connect-sdk@0.3.2

## 0.2.14

### Patch Changes

- 2e53c08: Add `board` + `stars` facets to `SearchDocument` (and carry them through the connect-adapter catalog projection), mirroring the platform's first-class filter facets so consumers can build/apply board-basis and star-rating filters.
- Updated dependencies [2e53c08]
  - @voyant-travel/connect-sdk@0.3.1

## 0.2.13

### Patch Changes

- d3c0034: Fix sourced stay quotes. `liveResolve` now emits flat `priceCents` + `currency` alongside the `price` money object (the catalog quote engine's pricing reader expects a numeric `priceCents`/`currency`, not a money object, so stay quotes previously extracted no pricing). It also infers the `stays` route from the query shape (`rooms[]` + check-in/out) when `connectRoute` isn't set explicitly, so sourced accommodation quotes no longer fall through to the generic availability path.
- Updated dependencies [ccd65a5]
  - @voyant-travel/connect-sdk@0.3.0

## 0.2.12

### Patch Changes

- Updated dependencies [4733680]
  - @voyant-travel/connect-sdk@0.2.0

## 0.2.11

### Patch Changes

- Updated dependencies [9f31956]
  - @voyant-travel/connect-sdk@0.1.6

## 0.2.10

### Patch Changes

- d37e299: Expose cruise sailing cabin option pricing and qualitative availability in normalized `cruises/v1` content.

## 0.2.9

### Patch Changes

- 869ebe5: Emit flattened `lowest_price_cents` and `currency` fields for `cruises/v1` sailing content instead of the nested `price_from` object.

## 0.2.8

### Patch Changes

- f4e8e75: Upgrade Voyant framework package peers and dev installs to the latest 0.85.3 line.

## 0.2.7

### Patch Changes

- 10d4451: Expose cruise price-from fields on operator cruise summaries and normalize sailing price-from values from canonical Connect price columns.
- Updated dependencies [10d4451]
  - @voyant-travel/connect-sdk@0.1.5

## 0.2.6

### Patch Changes

- 306b849: Expose canonical cruise projection/provenance fields on Connect cruise rows and prefer those fields when normalizing adapter cruise content.
- Updated dependencies [306b849]
  - @voyant-travel/connect-sdk@0.1.4

## 0.2.5

### Patch Changes

- 3fccb5b: Keep cruise itinerary variants scoped to their sailings instead of flattening every departure into one top-level itinerary.

## 0.2.4

### Patch Changes

- Updated dependencies [9825584]
  - @voyant-travel/connect-sdk@0.1.3

## 0.2.3

### Patch Changes

- b23180f: Publish `@voyant-travel/catalog` as a peer dependency so host apps own the catalog package graph.

## 0.2.2

### Patch Changes

- ad55f01: Add normalized cruise content resolution to the Connect catalog adapter, including source-ref recovery for flat Connect search-document ids.

## 0.2.1

### Patch Changes

- e267f77: Support live Connect search document rows that are returned as flat API records instead of `payload`-wrapped records.
- Updated dependencies [e267f77]
  - @voyant-travel/connect-sdk@0.1.2

## 0.2.0

### Minor Changes

- 9029eb8: Add the Connect-backed OSS catalog SourceAdapter package for Voyant apps.

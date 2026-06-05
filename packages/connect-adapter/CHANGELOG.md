# @voyantjs/connect-adapter

## 0.2.20

### Patch Changes

- Updated dependencies [65083c9]
  - @voyantjs/connect-sdk@0.7.1

## 0.2.19

### Patch Changes

- Updated dependencies [9d32125]
  - @voyantjs/connect-sdk@0.7.0

## 0.2.18

### Patch Changes

- Updated dependencies [dbc5975]
  - @voyantjs/connect-sdk@0.6.0

## 0.2.17

### Patch Changes

- Updated dependencies [54c4827]
  - @voyantjs/connect-sdk@0.5.0

## 0.2.16

### Patch Changes

- Updated dependencies [53f7d10]
  - @voyantjs/connect-sdk@0.4.0

## 0.2.15

### Patch Changes

- 3a4f807: Add `supplyModel` to `SearchDocument` (and carry it through the connect-adapter catalog projection), mirroring the platform's first-class facet. `supplyModel` is the supply-model mechanic a catalog surface forks on — `dynamic` (composed-live, any-date, calendar pricing) vs `scheduled` (dated departures/slots with an allotment) — so consumers can split the catalog into search-first vs browse-departures surfaces. Product _type_ stays in `category`.
- Updated dependencies [3a4f807]
  - @voyantjs/connect-sdk@0.3.2

## 0.2.14

### Patch Changes

- 2e53c08: Add `board` + `stars` facets to `SearchDocument` (and carry them through the connect-adapter catalog projection), mirroring the platform's first-class filter facets so consumers can build/apply board-basis and star-rating filters.
- Updated dependencies [2e53c08]
  - @voyantjs/connect-sdk@0.3.1

## 0.2.13

### Patch Changes

- d3c0034: Fix sourced stay quotes. `liveResolve` now emits flat `priceCents` + `currency` alongside the `price` money object (the catalog quote engine's pricing reader expects a numeric `priceCents`/`currency`, not a money object, so stay quotes previously extracted no pricing). It also infers the `stays` route from the query shape (`rooms[]` + check-in/out) when `connectRoute` isn't set explicitly, so sourced accommodation quotes no longer fall through to the generic availability path.
- Updated dependencies [ccd65a5]
  - @voyantjs/connect-sdk@0.3.0

## 0.2.12

### Patch Changes

- Updated dependencies [4733680]
  - @voyantjs/connect-sdk@0.2.0

## 0.2.11

### Patch Changes

- Updated dependencies [9f31956]
  - @voyantjs/connect-sdk@0.1.6

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
  - @voyantjs/connect-sdk@0.1.5

## 0.2.6

### Patch Changes

- 306b849: Expose canonical cruise projection/provenance fields on Connect cruise rows and prefer those fields when normalizing adapter cruise content.
- Updated dependencies [306b849]
  - @voyantjs/connect-sdk@0.1.4

## 0.2.5

### Patch Changes

- 3fccb5b: Keep cruise itinerary variants scoped to their sailings instead of flattening every departure into one top-level itinerary.

## 0.2.4

### Patch Changes

- Updated dependencies [9825584]
  - @voyantjs/connect-sdk@0.1.3

## 0.2.3

### Patch Changes

- b23180f: Publish `@voyantjs/catalog` as a peer dependency so host apps own the catalog package graph.

## 0.2.2

### Patch Changes

- ad55f01: Add normalized cruise content resolution to the Connect catalog adapter, including source-ref recovery for flat Connect search-document ids.

## 0.2.1

### Patch Changes

- e267f77: Support live Connect search document rows that are returned as flat API records instead of `payload`-wrapped records.
- Updated dependencies [e267f77]
  - @voyantjs/connect-sdk@0.1.2

## 0.2.0

### Minor Changes

- 9029eb8: Add the Connect-backed OSS catalog SourceAdapter package for Voyant apps.

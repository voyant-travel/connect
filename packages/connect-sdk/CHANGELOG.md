# @voyantjs/connect-sdk

## 0.3.0

### Minor Changes

- ccd65a5: Add the `PackageHold` contract type (+ `PackageHoldStatus`) — the Connect-side hold over a `PackageOffer`, mirroring `StayHold`. Returned by the package lock route; Connect always materialises a hold before confirm (binding `PackageConfirmInput.holdId`).

## 0.2.0

### Minor Changes

- 4733680: Add the packages (composed flight + stay) data plane.
  - `@voyantjs/connect-sdk`: new `Package*` contract types — `PackageOffer`, `PackageBooking`, `PackageSearchQuery`/`PackageSearchResponse`, `PackageConfirmInput`, `StayComponent`, `FlightSegment`, `ComponentRef`, `PackagePricing`, and a canonical `Traveler` (category + PII + optional sex).
  - `@voyantjs/connect-provider-sdk`: extend the hosted-worker protocol with the package operations — `searchPackages`, `lockPackage`, `confirmPackage`, `cancelPackage`, `getPackageBooking` (→ `/packages/*`), alongside the existing cruise + stays operations. Protocol version unchanged.

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

# @voyant-travel/connect-provider-sdk

## 0.4.0

### Minor Changes

- d6c8190: Add the `quoteStay` / `quotePackage` hosted-worker operations (→ `/stays/quote` / `/packages/quote`) — an optional re-price of an offer against the provider's live price just before lock, alongside the existing cruise/stays/packages operations. Protocol version unchanged.

## 0.3.0

### Minor Changes

- 4733680: Add the packages (composed flight + stay) data plane.
  - `@voyant-travel/connect-sdk`: new `Package*` contract types — `PackageOffer`, `PackageBooking`, `PackageSearchQuery`/`PackageSearchResponse`, `PackageConfirmInput`, `StayComponent`, `FlightSegment`, `ComponentRef`, `PackagePricing`, and a canonical `Traveler` (category + PII + optional sex).
  - `@voyant-travel/connect-provider-sdk`: extend the hosted-worker protocol with the package operations — `searchPackages`, `lockPackage`, `confirmPackage`, `cancelPackage`, `getPackageBooking` (→ `/packages/*`), alongside the existing cruise + stays operations. Protocol version unchanged.

## 0.2.0

### Minor Changes

- 25dd6ee: Add the accommodations (stays) operations to the hosted-worker protocol: `searchStays`, `lockStay`, `confirmStay`, `cancelStay`, `getStayBooking`, with their `/stays/*` operation paths. Lets a hosted connector worker serve the stays data plane alongside the existing cruise operations; the protocol version is unchanged.

## 0.1.2

### Patch Changes

- Expose hosted connector Worker protocol helpers from `@voyant-travel/connect-provider-sdk/hosted-worker`.

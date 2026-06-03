---
"@voyantjs/connect-sdk": minor
"@voyantjs/connect-provider-sdk": minor
---

Add the packages (composed flight + stay) data plane.

- `@voyantjs/connect-sdk`: new `Package*` contract types — `PackageOffer`, `PackageBooking`, `PackageSearchQuery`/`PackageSearchResponse`, `PackageConfirmInput`, `StayComponent`, `FlightSegment`, `ComponentRef`, `PackagePricing`, and a canonical `Traveler` (category + PII + optional sex).
- `@voyantjs/connect-provider-sdk`: extend the hosted-worker protocol with the package operations — `searchPackages`, `lockPackage`, `confirmPackage`, `cancelPackage`, `getPackageBooking` (→ `/packages/*`), alongside the existing cruise + stays operations. Protocol version unchanged.

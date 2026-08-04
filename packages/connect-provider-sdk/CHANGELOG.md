# @voyant-travel/connect-provider-sdk

## 0.6.0

### Minor Changes

- 30d22ff: Publish the flights data plane in the connector worker protocol, and make the
  protocol version able to move.

  The published protocol trailed the platform's internal copy by an entire
  vertical: fifteen flight operations existed in production and in no published
  package. The reference connector worked around it by hand-rolling its own
  operation table, noting in a comment that the stays connector "did the same
  dance". A protocol that connector authors fork cannot be the thing they declare
  compatibility against — see ADR-0022 in the voyant repository.
  - `ConnectorWorkerOperation` and `connectorWorkerOperationPaths` gain the
    fifteen flight operations, matching the platform surface exactly.
  - `ConnectorWorkerContext` gains the request-scoped `requestId`,
    `correlationId`, `idempotencyKey` and `environment` fields the platform
    already sends. Connectors were reading them through a cast because the
    declared type was behind the wire format.
  - `CONNECTOR_WORKER_PROTOCOL_VERSION` moves to `2026-08-04`. It had not been
    touched since the file was created, while twelve of the then twenty-two
    operations were added after it — and `verify:package-artifacts` asserted the
    frozen literal, so CI actively prevented the bump.

  `protocol-surface.json` now records the version alongside a checksum of the
  operation table, and `tests/connector-worker-protocol.test.mjs` fails when the
  surface moves without a bump. The artifact check asserts the packed tarball
  carries the recorded version rather than a hardcoded date, so the guardrail
  catches an unversioned surface change instead of preventing every change.

## 0.5.1

### Patch Changes

- 0130564: Relicense the public Connect packages from `FSL-1.1-Apache-2.0` to `Apache-2.0`.
  The root `LICENSE` is replaced with the standard Apache License 2.0 text.

## 0.5.0

### Minor Changes

- ceab4b0: Rename the npm scope from `@voyantjs` to `@voyant-travel` to match the renamed
  org. All packages, imports, repository/homepage URLs, and the default API base
  URL (`api.voyantjs.com` → `api.voyant.travel`) are updated. Consumers must update
  their dependencies to the `@voyant-travel/*` scope and re-point any pinned
  `@voyantjs/connect-*` imports.

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

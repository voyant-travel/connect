# Overview

`connect-sdk` is the public-facing Voyant Connect package monorepo. It
publishes four public TypeScript packages:

- `@voyant-travel/connect-sdk`
- `@voyant-travel/connect-adapter`
- `@voyant-travel/connect-provider-sdk`
- `@voyant-travel/connect-cruises`

Shared transport and error handling stay in a private internal package so the
public SDK boundary stays clean.

## Package boundaries

- `@voyant-travel/connect-sdk` wraps the Voyant Connect operator/connection control
  plane plus the gateway data plane for products, availability, bookings,
  suppliers, flights, and Connect-normalized inventory reads.
- `@voyant-travel/connect-adapter` adapts Connect inventory into the OSS catalog
  `SourceAdapter` contract for Voyant operator templates.
- `@voyant-travel/connect-provider-sdk` contains provider-author primitives:
  descriptors, credential parsing helpers, and small conformance utilities that
  supplier/provider-owned connector packages can depend on.
- `@voyant-travel/connect-cruises` adapts Connect-normalized cruise inventory into a
  Voyant deployment's cruises adapter boundary.
- `@voyant-sdk/sdk-core` contains shared request plumbing only.

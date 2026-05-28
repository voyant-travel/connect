# Repo Decisions

`connect-sdk` exists to publish the public-facing Voyant Connect package
family.

## What belongs here

- public Connect packages such as `@voyantjs/connect-sdk`,
  `@voyantjs/connect-provider-sdk`, and `@voyantjs/connect-cruises`
- shared SDK runtime code consumed by those packages
- package-level tests
- lightweight Markdown documentation

## What does not belong here

- private Voyant Connect implementation code
- provider-specific connector implementations that are intended for supplier
  handoff
- product dashboards or internal tooling
- a standalone docs app

The main docs application will live in `voyant`. This repo only needs enough
Markdown to explain package boundaries, release expectations, and contract
generation.

## Package boundaries

- `@voyantjs/connect-sdk` is for callers of Voyant Connect services
- `@voyantjs/connect-provider-sdk` is for provider integration authors
- `@voyantjs/connect-cruises` is for Voyant deployments consuming Connect
  cruise inventory
- `@voyant-sdk/sdk-core` is private and should contain only transport-level
  concerns

## Scope rule

- no product-specific business logic in `sdk-core`
- no supplier-specific connector implementations in the public SDK packages
- docs and examples should stay scoped to the Connect surface

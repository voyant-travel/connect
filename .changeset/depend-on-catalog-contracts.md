---
"@voyant-travel/connect-adapter": minor
"@voyant-travel/connect-cruises": minor
"@voyant-travel/plugin-voyant-connect": patch
---

Depend on the dependency-light `*-contracts` packages instead of the framework
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

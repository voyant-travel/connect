---
"@voyant-travel/connect-cruises": minor
---

Narrow the price-component `kind` on `ConnectExternalPriceRow` from `string` to
the `CruiseFareComponentKind` union (re-exported from `@voyant-travel/connect-sdk`).
This aligns `createConnectCruiseAdapter`'s return type with the cruise vertical's
`CruiseAdapter`, so downstream consumers can drop the `as CruiseAdapter` cast.

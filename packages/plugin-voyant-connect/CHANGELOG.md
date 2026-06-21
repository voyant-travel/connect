# @voyant-travel/plugin-voyant-connect

## 0.2.2

### Patch Changes

- 8ebf113: Move `@voyant-travel/plugin-voyant-connect` into the Connect repo alongside the
  other public Connect packages. It now consumes `@voyant-travel/connect-sdk`,
  `@voyant-travel/connect-adapter`, and `@voyant-travel/connect-cruises` from the
  workspace, and declares `@voyant-travel/catalog`, `@voyant-travel/cruises`, and
  `@voyant-travel/data-sdk` as peer dependencies provided by the host deployment.

  Because `connect-cruises` now returns vertical-conformant ship shapes, the
  internal `conformConnectCruiseAdapter` bridge and the `as CruiseAdapter` cast in
  the cruise source are removed — `createConnectCruiseAdapter` is used directly.

- Updated dependencies [dbfe4c2]
  - @voyant-travel/connect-cruises@0.6.0

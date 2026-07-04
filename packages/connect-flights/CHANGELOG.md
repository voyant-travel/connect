# @voyant-travel/connect-flights

## 0.2.0

### Minor Changes

- c256cfc: Add `@voyant-travel/connect-flights` — a Voyant Connect flights adapter that implements the Voyant `FlightConnectorAdapter` contract by proxying to connect-api via `@voyant-travel/connect-sdk`. A deployment swaps its in-process demo flight adapter for `createConnectFlightAdapter(...)` to route flights through Voyant Connect to the real GDS connector behind a connection (e.g. HiSky): search, price, book/hold, list orders, issue tickets, and cancel. Because flights speak one contract end-to-end, the adapter is a thin typed pass-through keyed on `ctx.connectionId`.

  Also adds `client.flights.listOrders(connectionId, query)` to the connect-sdk client (`GET /connect/v1/connections/:id/flights/orders`), backing the adapter's order list.

### Patch Changes

- Updated dependencies [c256cfc]
  - @voyant-travel/connect-sdk@0.10.0

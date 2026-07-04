# @voyant-travel/connect-flights

Voyant Connect flights adapter. Implements the Voyant `FlightConnectorAdapter`
contract by proxying to a Voyant Connect deployment's connect-api over HTTP
(via [`@voyant-travel/connect-sdk`](../connect-sdk)).

A Voyant deployment swaps its in-process demo flight adapter for this to route
flights through Voyant Connect to the real GDS connector behind a connection
(e.g. HiSky): search, price, book/hold, list orders, issue tickets, and cancel.

## Usage

```ts
import { createConnectFlightAdapter } from "@voyant-travel/connect-flights";

const adapter = createConnectFlightAdapter({
  connect: {
    apiKey: process.env.VOYANT_CONNECT_API_KEY!,
    operatorId: process.env.VOYANT_OPERATOR_ID!,
    baseUrl: process.env.VOYANT_CONNECT_BASE_URL, // defaults to the hosted API
  },
});

// In the deployment's flights runtime:
//   resolveAdapter(c) => adapter   (connectionId is supplied per request via ctx)
```

The connection id targeted by each call comes from `ctx.connectionId`.

## Scope

Implements the flight order lifecycle: `searchFlights`, `priceOffer`,
`bookFlight`, `getOrder`, `cancelOrder`, `listOrders`, `ticketOrder`.

Seat maps and ancillaries are not proxied yet: the connector contract models
them per-offer (pre-book), whereas the connect-sdk client exposes them
per-order (post-book), so they need an explicit mapping rather than a
pass-through. Tracked as a follow-up.

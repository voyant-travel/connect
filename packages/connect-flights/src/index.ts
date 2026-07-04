/**
 * Voyant Connect flights adapter.
 *
 * Implements the Voyant `FlightConnectorAdapter` contract by proxying to a
 * Voyant Connect deployment's connect-api over HTTP (via `@voyant-travel/
 * connect-sdk`). A deployment swaps its in-process demo adapter for this to
 * route flights through Voyant Connect to the real GDS connector behind a
 * connection (e.g. HiSky) — book/hold, list, ticket, and cancel orders.
 *
 * Flights speak one contract end-to-end (connect-api ↔ hosted connector ↔
 * deployment all use `@voyant-travel/flights-contracts`), and connect-api
 * returns those contract shapes verbatim under its `{ data }` envelope (which
 * the connect-sdk transport unwraps). The connect-sdk client types flight
 * payloads opaquely as `JsonObject`, so this adapter is a thin, typed
 * pass-through: forward the contract request, return the contract response.
 *
 * The connection id is taken from `ctx.connectionId` on every call — the
 * deployment supplies which connection each request targets.
 */

import {
  createVoyantConnectClient,
  type FlightBookInput,
  type FlightOrderListQuery,
  type FlightPriceInput,
  type FlightSearchInput,
  type VoyantConnectClient,
  type VoyantConnectClientOptions,
} from "@voyant-travel/connect-sdk";
import type {
  FlightAdapterCapabilities,
  FlightBookResponse,
  FlightCancelResponse,
  FlightConnectorAdapter,
  FlightGetOrderResponse,
  FlightOrdersListResponse,
  FlightPriceResponse,
  FlightSearchResponse,
} from "@voyant-travel/flights-contracts/contract/adapter";

export interface ConnectFlightAdapterOptions {
  /** A pre-built Voyant Connect client. */
  client?: VoyantConnectClient;
  /** Options to build a client (apiKey, operatorId, baseUrl) when `client` is not supplied. */
  connect?: VoyantConnectClientOptions;
  /** `capabilities.provider` label — default `"connect"`. */
  provider?: string;
  /**
   * Declared flight capabilities for connections behind this adapter. The
   * authoritative capabilities live per-connection at connect-api (from the
   * connector's manifest); this static value is a best-effort hint for the
   * deployment's orchestration. Defaults to holds + list-orders (Voyant
   * Connect always lists orders from its own store, even when the underlying
   * GDS connector cannot enumerate them).
   */
  capabilities?: FlightAdapterCapabilities;
}

function resolveClient(options: ConnectFlightAdapterOptions): VoyantConnectClient {
  if (options.client) return options.client;
  if (!options.connect) {
    throw new Error(
      "createConnectFlightAdapter requires either a `client` or `connect` option",
    );
  }
  return createVoyantConnectClient(options.connect);
}

/**
 * Build a `FlightConnectorAdapter` backed by Voyant Connect. Drop the result
 * into the deployment's flights runtime `resolveAdapter` in place of the demo
 * adapter.
 */
export function createConnectFlightAdapter(
  options: ConnectFlightAdapterOptions,
): FlightConnectorAdapter {
  const client = resolveClient(options);
  const capabilities: FlightAdapterCapabilities = options.capabilities ?? {
    provider: options.provider ?? "connect",
    declared: ["flight/holds", "flight/list-orders"],
  };

  return {
    capabilities,

    async searchFlights(ctx, request) {
      return (await client.flights.searchOnConnection(
        ctx.connectionId,
        request as unknown as FlightSearchInput,
      )) as unknown as FlightSearchResponse;
    },

    async priceOffer(ctx, request) {
      return (await client.flights.price(
        ctx.connectionId,
        request as unknown as FlightPriceInput,
      )) as unknown as FlightPriceResponse;
    },

    async bookFlight(ctx, request) {
      return (await client.flights.book(
        ctx.connectionId,
        request as unknown as FlightBookInput,
      )) as unknown as FlightBookResponse;
    },

    async getOrder(ctx, orderId) {
      return (await client.flights.getOrder(
        ctx.connectionId,
        orderId,
      )) as unknown as FlightGetOrderResponse;
    },

    // connect-api's cancel route takes no reason body, so it is not forwarded.
    async cancelOrder(ctx, orderId) {
      return (await client.flights.cancelOrder(
        ctx.connectionId,
        orderId,
      )) as unknown as FlightCancelResponse;
    },

    // Reads connect-api's operator-scoped order store — GDS connectors can't
    // enumerate orders, so this does not depend on adapter list support.
    async listOrders(ctx, query) {
      const clientQuery: FlightOrderListQuery = {
        ...(query.cursor ? { cursor: query.cursor } : {}),
        ...(query.limit !== undefined ? { limit: query.limit } : {}),
        ...(query.search ? { q: query.search } : {}),
        ...(query.status ? { status: query.status } : {}),
      };
      return (await client.flights.listOrders(
        ctx.connectionId,
        clientQuery,
      )) as unknown as FlightOrdersListResponse;
    },

    // Promote a held order to ticketed (connect-api gates on the connector's
    // `flight/holds` capability).
    async ticketOrder(ctx, orderId) {
      return (await client.flights.ticketOrder(
        ctx.connectionId,
        orderId,
      )) as unknown as FlightGetOrderResponse;
    },
  };
}

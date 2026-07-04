import assert from "node:assert/strict";
import test from "node:test";

import { createConnectFlightAdapter } from "../packages/connect-flights/dist/index.js";

const FLIGHT_METHODS = [
  "searchOnConnection",
  "price",
  "book",
  "getOrder",
  "cancelOrder",
  "listOrders",
  "ticketOrder",
];

/** Adapter wired to a fake connect-sdk client that records calls. */
function makeAdapter(returns = {}) {
  const calls = [];
  const flights = {};
  for (const name of FLIGHT_METHODS) {
    flights[name] = async (...args) => {
      calls.push({ name, args });
      return returns[name] ?? {};
    };
  }
  const adapter = createConnectFlightAdapter({ client: { flights } });
  return { adapter, calls };
}

const ctx = { connectionId: "conn_1", credentials: {} };

test("bookFlight proxies to the connection and returns the order response", async () => {
  const order = { orderId: "PNR1", pnr: "PNR1", status: "confirmed" };
  const { adapter, calls } = makeAdapter({ book: { order } });

  const res = await adapter.bookFlight(ctx, { offerId: "off_1", passengers: [] });

  assert.deepEqual(res, { order });
  assert.equal(calls[0].name, "book");
  assert.equal(calls[0].args[0], "conn_1"); // connectionId from ctx
  assert.equal(calls[0].args[1].offerId, "off_1"); // request forwarded
});

test("listOrders maps filters (search→q) and returns the page", async () => {
  const page = { orders: [{ orderId: "PNR1" }], pagination: { total: 1, hasMore: false } };
  const { adapter, calls } = makeAdapter({ listOrders: page });

  const res = await adapter.listOrders(ctx, {
    search: "PNR",
    status: ["confirmed"],
    limit: 10,
    cursor: "5",
  });

  assert.deepEqual(res, page);
  const query = calls[0].args[1];
  assert.equal(query.q, "PNR"); // search → q
  assert.deepEqual(query.status, ["confirmed"]);
  assert.equal(query.limit, 10);
  assert.equal(query.cursor, "5");
  assert.ok(!("search" in query)); // not passed through verbatim
});

test("listOrders omits absent filters", async () => {
  const { adapter, calls } = makeAdapter({
    listOrders: { orders: [], pagination: { total: 0, hasMore: false } },
  });

  await adapter.listOrders(ctx, {});

  assert.deepEqual(calls[0].args[1], {});
});

test("getOrder / cancelOrder / ticketOrder pass connection + order id", async () => {
  const wrapped = { order: { orderId: "PNR1" } };
  const { adapter, calls } = makeAdapter({
    getOrder: wrapped,
    cancelOrder: wrapped,
    ticketOrder: wrapped,
  });

  await adapter.getOrder(ctx, "PNR1");
  await adapter.cancelOrder(ctx, "PNR1");
  await adapter.ticketOrder(ctx, "PNR1");

  assert.deepEqual(
    calls.map((c) => c.name),
    ["getOrder", "cancelOrder", "ticketOrder"],
  );
  for (const call of calls) {
    assert.deepEqual(call.args, ["conn_1", "PNR1"]);
  }
});

test("declares connect capabilities by default", () => {
  const { adapter } = makeAdapter();
  assert.equal(adapter.capabilities.provider, "connect");
  assert.ok(adapter.capabilities.declared.includes("flight/holds"));
  assert.ok(adapter.capabilities.declared.includes("flight/list-orders"));
});

test("honors a custom provider label and capabilities", () => {
  const adapter = createConnectFlightAdapter({
    client: { flights: {} },
    capabilities: { provider: "hisky", declared: ["flight/holds"] },
  });
  assert.equal(adapter.capabilities.provider, "hisky");
  assert.deepEqual(adapter.capabilities.declared, ["flight/holds"]);
});

test("throws without a client or connect option", () => {
  assert.throws(
    () => createConnectFlightAdapter({}),
    /requires either a `client` or `connect`/,
  );
});

import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  createAccommodationConnector,
  stayOfferSchema,
} from "../packages/connect-provider-sdk/dist/accommodations/index.js";
const secret = "test-connector-secret";
function signed(operation, input, overrides = {}) {
  const path = { searchStays: "/stays/search", quoteStay: "/stays/quote", validateCredentials: "/validate-credentials" }[
    operation
  ];
  const body = JSON.stringify({
    protocolVersion: "2026-08-04",
    operation,
    context: {
      connectionId: "conn_1",
      connection: { providerKey: "example-stays" },
    },
    input,
    ...overrides,
  });
  const timestamp = String(Math.floor(Date.now() / 1000));
  return new Request("https://connector.example" + path, {
    method: "POST",
    body,
    headers: {
      "X-Voyant-Connector-Timestamp": timestamp,
      "X-Voyant-Connector-Signature":
        "sha256=" +
        createHmac("sha256", secret)
          .update(`${timestamp}POST${path}${body}`)
          .digest("hex"),
    },
  });
}
const query = {
  accommodationIds: ["hotel_1"],
  checkIn: "2027-01-20",
  checkOut: "2027-01-22",
  rooms: [{ adults: 2, children: 1 }],
};
function worker(searchStays, validateCredentials) {
  return createAccommodationConnector({
    providerKey: "example-stays",
    signingSecret: secret,
    validateCredentials,
    handlers: {
      searchStays,
      async confirmStay() {
        throw new Error("unused");
      },
      async cancelStay() {
        throw new Error("unused");
      },
      async getStayBooking() {
        return null;
      },
    },
  });
}
test("serves a manifest with only implemented operations", async () => {
  const response = await worker(async () => [])(
    new Request(
      "https://connector.example/.well-known/voyant-connect/manifest",
    ),
  );
  const manifest = await response.json();
  assert.equal(manifest.providerKey, "example-stays");
  assert.ok(manifest.capabilities.includes("searchStays"));
  assert.ok(!manifest.capabilities.includes("lockStay"));
});
test("dispatches a signed stay request with typed occupancy", async () => {
  const response = await worker(async (context, input) => {
    assert.equal(context.connectionId, "conn_1");
    assert.deepEqual(input.query, query);
    return [];
  })(signed("searchStays", { connectionId: "conn_1", query }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, data: [] });
});
test("refuses unsigned calls before contacting the backend", async () => {
  let called = false;
  const response = await worker(async () => {
    called = true;
    return [];
  })(
    new Request("https://connector.example/stays/search", {
      method: "POST",
      body: "{}",
    }),
  );
  assert.equal(response.status, 401);
  assert.equal(called, false);
});
test("refuses forged connection identity and invalid occupancy", async () => {
  const handler = worker(async () => {
    throw new Error("must not dispatch");
  });
  assert.equal(
    (await handler(signed("searchStays", { connectionId: "another", query })))
      .status,
    409,
  );
  assert.equal(
    (
      await handler(
        signed("searchStays", {
          connectionId: "conn_1",
          query: { ...query, rooms: [{ adults: 0 }] },
        }),
      )
    ).status,
    400,
  );
});
test("published stay schema requires the selected room, rate plan and nightly money", () => {
  assert.equal(
    stayOfferSchema.safeParse({
      id: "offer",
      connectionId: "conn",
      accommodationId: "hotel",
      rooms: [{}],
    }).success,
    false,
  );
});

test("validates credentials through the signed public worker contract", async () => {
  let called = false;
  const response = await worker(async () => [], async context => {
    called = true;
    assert.equal(context.connectionId, "conn_1");
    return { allowedMarkets: ["JP"] };
  })(signed("validateCredentials", {}));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, data: { allowedMarkets: ["JP"] } });
  assert.equal(called, true);
});
test("rejects invalid backend output as a connector failure", async () => {
  const response = await worker(async () => [{ id: "incomplete" }])(
    signed("searchStays", { connectionId: "conn_1", query }),
  );
  assert.equal(response.status, 502);
});

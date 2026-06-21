import assert from "node:assert/strict";
import test, { mock } from "node:test";

import { createVoyantConnectClient } from "../packages/connect-sdk/dist/index.js";
import {
  createVoyantConnectSources,
  listVoyantConnectSourceConnections,
  prepareVoyantConnectSources,
  registerVoyantConnectSources,
  resolveVoyantConnectEnv,
} from "../packages/plugin-voyant-connect/dist/index.js";

function fakeRegistry() {
  return {
    register: mock.fn(),
    resolveByConnection: mock.fn(),
    resolveByConnectionOrThrow: mock.fn(),
    resolveOrThrow: mock.fn(),
    byKind: mock.fn(() => []),
    connections: mock.fn(() => []),
    kinds: mock.fn(() => []),
    has: mock.fn(() => false),
    hasKind: mock.fn(() => false),
  };
}

function fakeClient(options) {
  const client = createVoyantConnectClient({
    apiKey: "test",
    operatorId: "op_123",
  });
  client.connections.list = mock.fn(async () => options?.list ?? []);
  client.connections.get = mock.fn(async (_operatorId, connectionId) => {
    const detail = options?.details?.[connectionId];
    if (!detail) throw new Error("missing detail");
    return detail;
  });
  client.products.listOnConnection = mock.fn(async () => []);
  client.accommodations.list = mock.fn(async () => []);
  return client;
}

function fakeConnection(overrides) {
  return {
    id: overrides.id,
    operatorId: overrides.operatorId ?? "op_123",
    supplierName: overrides.supplierName ?? "Supplier",
    providerKey: overrides.providerKey ?? null,
    providerRegistrationId: overrides.providerRegistrationId ?? null,
    status: overrides.status ?? "active",
    market: overrides.market ?? null,
    webhookSigningSecretLast4: overrides.webhookSigningSecretLast4 ?? null,
    createdAt: overrides.createdAt ?? "2026-01-01T00:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-01-01T00:00:00.000Z",
    metadata: overrides.metadata ?? null,
  };
}

test("resolveVoyantConnectEnv returns null and stays silent when unconfigured", () => {
  const warn = mock.fn();
  assert.equal(resolveVoyantConnectEnv({}, { warn }), null);
  assert.equal(warn.mock.calls.length, 0);
});

test("resolveVoyantConnectEnv warns and returns null when config is partial", () => {
  const warn = mock.fn();
  assert.equal(resolveVoyantConnectEnv({ VOYANT_API_KEY: "k" }, { warn }), null);
  assert.equal(warn.mock.calls.length, 1);
});

test("resolveVoyantConnectEnv resolves the full config with the documented key fallback order", () => {
  assert.deepEqual(
    resolveVoyantConnectEnv({
      VOYANT_CONNECT_API_KEY: "fallback",
      VOYANT_CONNECT_OPERATOR_ID: "op_1",
      VOYANT_CONNECT_API_URL: "https://connect.example",
      VOYANT_CONNECT_MARKET: "GB",
      VOYANT_CONNECT_SYNC_LIMIT: "100",
      VOYANT_CLOUD_API_URL: "https://api.example/",
    }),
    {
      apiKey: "fallback",
      operatorId: "op_1",
      baseUrl: "https://connect.example",
      market: "GB",
      syncLimit: "100",
      dataBaseUrl: "https://api.example",
    },
  );
});

test("resolveVoyantConnectEnv prefers VOYANT_API_KEY over the legacy aliases", () => {
  const config = resolveVoyantConnectEnv({
    VOYANT_API_KEY: "primary",
    VOYANT_CONNECT_API_KEY: "legacy",
    VOYANT_CLOUD_API_KEY: "older",
    VOYANT_CONNECT_OPERATOR_ID: "op_1",
  });
  assert.equal(config?.apiKey, "primary");
});

test("prepareVoyantConnectSources returns [] when Connect is unconfigured", async () => {
  assert.deepEqual(await prepareVoyantConnectSources({}), []);
});

test("prepareVoyantConnectSources returns the un-scoped default adapter pair when enumerate is omitted", async () => {
  const sources = await prepareVoyantConnectSources({
    VOYANT_API_KEY: "k",
    VOYANT_CONNECT_OPERATOR_ID: "op_1",
  });
  assert.deepEqual(
    sources.map((source) => [source.connectionId, source.role]),
    [
      [undefined, "generic"],
      [undefined, "cruises"],
    ],
  );
});

test("createVoyantConnectSources creates default sources when connections are omitted", () => {
  const sources = createVoyantConnectSources({
    client: fakeClient(),
    operatorId: "op_123",
    geo: false,
  });
  assert.deepEqual(
    sources.map((source) => [source.connectionId, source.role]),
    [
      [undefined, "generic"],
      [undefined, "cruises"],
    ],
  );
});

test("createVoyantConnectSources does not create default sources when connections are explicitly empty", () => {
  const sources = createVoyantConnectSources({
    client: fakeClient(),
    operatorId: "op_123",
    connections: [],
    geo: false,
  });
  assert.deepEqual(sources, []);
});

test("createVoyantConnectSources does not create default sources when explicit connections filter to empty", () => {
  const sources = createVoyantConnectSources({
    client: fakeClient(),
    operatorId: "op_123",
    connections: [{ id: "conn_paused", status: "paused", providerKey: "tui" }],
    geo: false,
  });
  assert.deepEqual(sources, []);
});

test("createVoyantConnectSources creates generic, structured cruise, and TUI package sources per active connection", () => {
  const sources = createVoyantConnectSources({
    client: fakeClient(),
    operatorId: "op_123",
    connections: [{ id: "conn_tui", status: "active", providerKey: "tui" }],
    geo: false,
    destinationNames: false,
  });
  assert.deepEqual(
    sources.map((source) => [
      source.connectionId,
      source.role,
      source.sourceProvider,
    ]),
    [
      ["conn_tui", "generic", "tui"],
      ["conn_tui:cruises", "cruises", "tui"],
      ["conn_tui:products", "tui-products", "tui"],
    ],
  );
});

test("registerVoyantConnectSources registers connection-scoped sources on the catalog registry", () => {
  const registry = fakeRegistry();
  const sources = createVoyantConnectSources({
    client: fakeClient(),
    operatorId: "op_123",
    connections: [{ id: "conn_viking", status: "active", supplierName: "Viking" }],
    geo: false,
    destinationNames: false,
  });

  registerVoyantConnectSources(registry, sources);

  assert.equal(registry.register.mock.calls.length, 2);
  assert.deepEqual(registry.register.mock.calls[0].arguments, [
    "conn_viking",
    sources[0]?.adapter,
  ]);
  assert.deepEqual(registry.register.mock.calls[1].arguments, [
    "conn_viking:cruises",
    sources[1]?.adapter,
  ]);
});

test("prepareVoyantConnectSources uses pre-fetched connections and skips the network enumeration", async () => {
  // The internally-built live client lists no connections, so if enumeration ran
  // we'd get no sources. Getting conn_pre sources back proves the supplied list
  // short-circuited the network call.
  const sources = await prepareVoyantConnectSources(
    {
      VOYANT_API_KEY: "k",
      VOYANT_CONNECT_OPERATOR_ID: "op_1",
    },
    {
      enumerate: true,
      connections: [{ id: "conn_pre", status: "active", providerKey: "tui" }],
    },
  );
  assert.deepEqual(
    sources.map((source) => [source.connectionId, source.role]),
    [
      ["conn_pre", "generic"],
      ["conn_pre:cruises", "cruises"],
      ["conn_pre:products", "tui-products"],
    ],
  );
});

test("prepareVoyantConnectSources reads connections from connectionCache on a hit without enumerating", async () => {
  const get = mock.fn(async () => [
    { id: "conn_cached", status: "active", providerKey: "tui" },
  ]);
  const set = mock.fn(async () => {});
  const sources = await prepareVoyantConnectSources(
    { VOYANT_API_KEY: "k", VOYANT_CONNECT_OPERATOR_ID: "op_1" },
    { enumerate: true, connectionCache: { get, set } },
  );
  assert.equal(get.mock.calls.length, 1);
  assert.equal(set.mock.calls.length, 0);
  assert.deepEqual(
    sources.map((source) => source.connectionId),
    ["conn_cached", "conn_cached:cruises", "conn_cached:products"],
  );
});

test("prepareVoyantConnectSources enumerates and populates connectionCache on a miss", async () => {
  // The internally-built client falls through to the real transport, so stub
  // fetch to return an empty connection list for the enumeration request.
  const fetchMock = mock.method(globalThis, "fetch", async () =>
    new Response("[]", { headers: { "content-type": "application/json" } }),
  );
  try {
    const get = mock.fn(async () => undefined);
    const stored = [];
    const set = mock.fn(async (connections) => {
      stored.push(...connections);
    });
    await prepareVoyantConnectSources(
      { VOYANT_API_KEY: "k", VOYANT_CONNECT_OPERATOR_ID: "op_1" },
      { enumerate: true, connectionCache: { get, set } },
    );
    assert.equal(get.mock.calls.length, 1);
    assert.equal(set.mock.calls.length, 1);
    assert.ok(fetchMock.mock.calls.length >= 1);
    // The stubbed enumeration returns no connections, so the cache is set to [].
    assert.deepEqual(stored, []);
  } finally {
    fetchMock.mock.restore();
  }
});

test("listVoyantConnectSourceConnections keeps only active connections and enriches provider details", async () => {
  const client = fakeClient({
    list: [
      fakeConnection({ id: "conn_active", status: "active" }),
      fakeConnection({ id: "conn_paused", status: "paused" }),
    ],
    details: {
      conn_active: fakeConnection({
        id: "conn_active",
        status: "active",
        providerKey: "tui",
        supplierName: "TUI",
      }),
    },
  });

  assert.deepEqual(
    await listVoyantConnectSourceConnections({ client, operatorId: "op_123" }),
    [
      {
        id: "conn_active",
        status: "active",
        providerKey: "tui",
        supplierName: "TUI",
      },
    ],
  );
});

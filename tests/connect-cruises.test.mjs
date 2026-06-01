import assert from "node:assert/strict";
import test from "node:test";

import { createConnectCruiseAdapter } from "../packages/connect-cruises/dist/index.js";

function cruiseRow(overrides = {}) {
  return {
    id: "ccr_1",
    connectionId: "conn_1",
    externalId: "ext_1",
    cruiseLineExternalId: "viking",
    shipExternalId: "one",
    name: "Adriatic & Mediterranean Discovery",
    slug: null,
    status: "active",
    cruiseType: "ocean",
    nights: 12,
    destinations: ["Italy"],
    embarkationPortCode: "VCE",
    disembarkationPortCode: "ATH",
    locale: "en",
    market: "US",
    currency: "USD",
    priceFromAmountMinor: 735900,
    priceFromCurrency: "USD",
    sourceKind: "voyant-connect",
    sourceProvider: "viking",
    sourceConnectionId: "conn_src",
    sourceRef: "cruise:ext_1:en",
    projection: {
      shipName: "Viking Jupiter",
      regionIds: ["region:mediterranean"],
      waterwayIds: ["sea:adriatic"],
      portIds: ["port:VCE"],
      countryIso: ["IT", "GR"],
      regions: ["Mediterranean"],
      waterways: ["Adriatic"],
      ports: ["Venice"],
      countries: ["Italy", "Greece"],
    },
    payload: {
      media: [{ url: "https://example.com/cover.jpg", isCover: true }],
    },
    providerKey: "viking",
    supplierName: "Viking Cruises",
    lastSyncedAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

async function firstProjection(rows) {
  const adapter = createConnectCruiseAdapter({
    client: { cruises: { list: async () => rows } },
    operatorId: "opr_1",
  });
  for await (const entry of adapter.searchProjection()) return entry;
  return null;
}

test("cruise search projection surfaces ids, status, price, image, and camelCase geo", async () => {
  const entry = await firstProjection([cruiseRow()]);
  assert.ok(entry);
  assert.equal(entry.salesStatus, "active"); // was hardcoded null
  assert.equal(entry.lineExternalId, "viking"); // for lineSupplierId binding
  assert.equal(entry.shipExternalId, "one"); // for defaultShipId binding
  assert.equal(entry.shipName, "Viking Jupiter"); // real name, not the id
  assert.equal(entry.lowestPrice, "7359.00"); // lifted from priceFromAmountMinor
  assert.equal(entry.lowestPriceCurrency, "USD");
  assert.equal(entry.heroImageUrl, "https://example.com/cover.jpg"); // from media
  assert.deepEqual(entry.regionIds, ["region:mediterranean"]); // camelCase read
  assert.deepEqual(entry.waterwayIds, ["sea:adriatic"]);
  assert.deepEqual(entry.countryIso, ["IT", "GR"]);
});

test("cruise search projection falls back to legacy snake_case geo keys", async () => {
  const entry = await firstProjection([
    cruiseRow({
      projection: {
        region_ids: ["region:caribbean"],
        waterway_ids: ["sea:caribbean"],
        port_ids: ["port:MIA"],
        country_iso: ["US"],
      },
    }),
  ]);
  assert.ok(entry);
  assert.deepEqual(entry.regionIds, ["region:caribbean"]);
  assert.deepEqual(entry.waterwayIds, ["sea:caribbean"]);
  assert.deepEqual(entry.portIds, ["port:MIA"]);
  assert.deepEqual(entry.countryIso, ["US"]);
});

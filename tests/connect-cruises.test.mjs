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

test("fetchCruise reads rich detail from payload.*", async () => {
  const row = {
    name: "A Portrait of Majestic France",
    slug: null,
    cruiseType: "river",
    cruiseLineExternalId: "uniworld",
    supplierName: "Uniworld",
    shipExternalId: "49-from-2027",
    nights: 14,
    destinations: ["France"],
    embarkationPortCode: "BOD",
    disembarkationPortCode: "OPO",
    // Structural columns are top-level; the rich content is under payload.
    payload: {
      description: "x".repeat(995),
      summary: "A wine-focused river cruise.",
      highlights: ["Bordeaux", "Porto"],
      embarkationPort: { name: "Bordeaux" },
      disembarkationPort: { name: "Porto" },
      media: [{ url: "https://example.com/cover.jpg", isCover: true }],
    },
  };
  const adapter = createConnectCruiseAdapter({
    client: { cruises: { getOnConnection: async () => row } },
    operatorId: "opr_1",
  });
  const cruise = await adapter.fetchCruise({
    connectionId: "conn_1",
    externalId: "173_49-from-2027",
    kind: "cruise",
  });
  assert.ok(cruise);
  assert.equal(cruise.description?.length, 995); // was "" (read top-level)
  assert.equal(cruise.shortDescription, "A wine-focused river cruise.");
  assert.deepEqual(cruise.highlights, ["Bordeaux", "Porto"]);
  assert.ok(cruise.defaultShipRef); // was null → ship/cabins were skipped
  assert.equal(cruise.defaultShipRef.externalId, "49-from-2027");
  assert.equal(cruise.embarkPortName, "Bordeaux");
  assert.equal(cruise.disembarkPortName, "Porto");
  assert.equal(cruise.heroImageUrl, "https://example.com/cover.jpg");
  assert.equal(cruise.lineName, "Uniworld");
});

test("fetchShip reads the gallery from payload.images", async () => {
  const row = {
    name: "S.S. Joie de Vivre",
    shipType: "river",
    capacityGuests: 128,
    payload: {
      images: [
        { url: "https://example.com/ship-1.jpg" },
        { url: "https://example.com/ship-2.jpg" },
      ],
    },
  };
  const adapter = createConnectCruiseAdapter({
    client: { cruises: { getShip: async () => row } },
    operatorId: "opr_1",
  });
  const ship = await adapter.fetchShip({
    connectionId: "conn_1",
    externalId: "49-from-2027",
    kind: "ship",
  });
  assert.ok(ship);
  assert.equal(ship.name, "S.S. Joie de Vivre");
  assert.equal(ship.capacityGuests, 128);
  assert.deepEqual(ship.gallery, [
    "https://example.com/ship-1.jpg",
    "https://example.com/ship-2.jpg",
  ]);
});

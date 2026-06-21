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
      sailings: {
        count: 7,
        nextDeparture: "2026-09-13",
        earliestDeparture: "2026-05-01",
      },
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
  assert.equal(entry.departureCount, 7); // lifted from projection.sailings
  assert.equal(entry.nextDeparture, "2026-09-13");
  assert.equal(entry.earliestDeparture, "2026-05-01");
});

test("cruise search projection leaves sailing summary null when absent", async () => {
  const entry = await firstProjection([
    cruiseRow({ projection: { shipName: "Viking Jupiter" } }),
  ]);
  assert.ok(entry);
  assert.equal(entry.departureCount, null);
  assert.equal(entry.nextDeparture, null);
  assert.equal(entry.earliestDeparture, null);
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
      description: "An intimate river ship.",
      deckPlanUrl: "https://example.com/deckplan.jpg",
      decks: [
        { name: "Main Deck", imageUrl: "https://example.com/deck-main.jpg" },
        // No name — dropped so we never emit a non-conformant deck.
        { imageUrl: "https://example.com/deck-unnamed.jpg" },
      ],
      images: [
        { url: "https://example.com/ship-1.jpg" },
        { url: "https://example.com/ship-2.jpg" },
      ],
    },
  };
  const cabins = [
    {
      externalId: "cat_inside",
      code: "I1",
      name: "Inside Stateroom",
      roomType: "inside",
      maxTotal: 2,
      payload: {
        description: "Cozy inside stateroom.",
        gradeCodes: ["I1", "I2"],
        wheelchairAccessible: true,
        features: ["wifi"],
        area: { value: 150, unit: "sqft" },
        images: [{ url: "https://example.com/cabin.jpg" }],
        roomLayoutImages: [{ url: "https://example.com/cabin-floor.jpg" }],
      },
    },
    {
      externalId: "cat_studio",
      code: "S1",
      name: "Studio",
      roomType: "studio",
      maxTotal: 1,
      payload: {},
    },
  ];
  const adapter = createConnectCruiseAdapter({
    client: {
      cruises: {
        getShip: async () => row,
        listCabinCategories: async () => cabins,
      },
    },
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
  assert.equal(ship.description, "An intimate river ship.");
  assert.equal(ship.deckPlanUrl, "https://example.com/deckplan.jpg");
  // Decks expose `planImageUrl` (the field the cruise vertical reads) and
  // nameless decks are dropped.
  assert.deepEqual(ship.decks, [
    { name: "Main Deck", planImageUrl: "https://example.com/deck-main.jpg" },
  ]);
  assert.deepEqual(ship.gallery, [
    "https://example.com/ship-1.jpg",
    "https://example.com/ship-2.jpg",
  ]);
  // Cabin categories are fetched + attached (the Options tab).
  assert.equal(ship.categories?.length, 2);
  assert.equal(ship.categories[0].code, "I1");
  assert.equal(ship.categories[0].roomType, "inside");
  assert.equal(ship.categories[0].description, "Cozy inside stateroom.");
  assert.deepEqual(ship.categories[0].gradeCodes, ["I1", "I2"]);
  assert.equal(ship.categories[0].wheelchairAccessible, true);
  assert.equal(ship.categories[0].maxOccupancy, 2);
  assert.equal(ship.categories[0].squareFeet, "150");
  assert.deepEqual(ship.categories[0].amenities, ["wifi"]);
  assert.deepEqual(ship.categories[0].images, [
    "https://example.com/cabin.jpg",
  ]);
  // Emitted as `floorplanImages` (the vertical's field) from the upstream
  // `roomLayoutImages` payload key.
  assert.deepEqual(ship.categories[0].floorplanImages, [
    "https://example.com/cabin-floor.jpg",
  ]);
  // studio is normalized to a catalog room type.
  assert.equal(ship.categories[1].roomType, "single");
});

test("detail reads require a connectionId on the source ref", async () => {
  let shipCalls = 0;
  const adapter = createConnectCruiseAdapter({
    client: {
      cruises: {
        getShip: async () => {
          shipCalls += 1;
          return {};
        },
        listCabinCategories: async () => [],
      },
    },
    operatorId: "opr_1",
  });
  // connectionId is optional on the ref (to match the cruise vertical's
  // SourceRef), so the adapter guards it rather than issuing a call against
  // `/connections/undefined/...`.
  await assert.rejects(
    adapter.fetchShip({ externalId: "49-from-2027", kind: "ship" }),
    /requires a connectionId/,
  );
  assert.equal(shipCalls, 0);
});

test("fetchSailing maps the rollup from-price without an extra pricing call", async () => {
  const row = {
    externalId: "sail_1",
    cruiseExternalId: "173_49-from-2027",
    shipExternalId: "49-from-2027",
    departureDate: "2027-04-10",
    returnDate: "2027-04-24",
    salesStatus: "open",
    priceFromAmountMinor: 1295900, // $12,959 — already on the sailing row
    priceFromCurrency: "USD",
  };
  const adapter = createConnectCruiseAdapter({
    client: { cruises: { getSailingOnConnection: async () => row } },
    operatorId: "opr_1",
  });
  const sailing = await adapter.fetchSailing({
    connectionId: "conn_1",
    externalId: "sail_1",
    kind: "sailing",
  });
  assert.ok(sailing);
  assert.equal(sailing.lowestPriceCents, 1295900);
});

test("fetchSailingItinerary reads day descriptions + times from payload", async () => {
  const days = [
    {
      dayNumber: 1,
      title: "Bordeaux",
      portName: "Bordeaux",
      isSeaDay: false,
      isOvernight: true,
      arriveAt: null,
      departAt: "2027-04-10T18:00:00.000Z",
      payload: {
        description: "Arrive at Bordeaux-Mérignac International Airport…",
      },
    },
    {
      dayNumber: 2,
      title: "Cadillac",
      portName: "Cadillac",
      isSeaDay: false,
      isOvernight: false,
      arriveAt: "2027-04-11T08:00:00.000Z",
      departAt: "2027-04-11T22:00:00.000Z",
      payload: { description: "The French phrase 'la douceur de vivre'…" },
    },
  ];
  const adapter = createConnectCruiseAdapter({
    client: { cruises: { listItinerary: async () => days } },
    operatorId: "opr_1",
  });
  const itinerary = await adapter.fetchSailingItinerary({
    connectionId: "conn_1",
    externalId: "sail_1",
    kind: "sailing",
  });
  assert.equal(itinerary.length, 2);
  // The narrative comes from payload.description, not the port title.
  assert.ok(itinerary[0].description.startsWith("Arrive at Bordeaux"));
  assert.notEqual(itinerary[0].description, itinerary[0].title);
  assert.equal(itinerary[1].arrivalTime, "2027-04-11T08:00:00.000Z");
  assert.equal(itinerary[1].departureTime, "2027-04-11T22:00:00.000Z");
});

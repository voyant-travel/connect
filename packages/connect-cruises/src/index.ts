import {
  createVoyantConnectClient,
  type CabinPricing,
  type CruiseConfirmInput,
  type CruisePassenger,
  type CruiseFareComponent,
  type CruiseFareComponentKind,
  type CruisePassengerOccupancy,
  type OperatorCruiseSummary,
  type VoyantConnectClient,
  type VoyantConnectClientOptions,
} from "@voyant-travel/connect-sdk";

type JsonObject = Record<string, unknown>;

export type ConnectCruiseSourceRef = {
  // Optional to match the cruise vertical's `SourceRef`; the adapter guards it
  // via `requireConnectionId` before issuing connection-scoped Connect calls.
  connectionId?: string;
  providerKey?: string | null;
  externalId: string;
  kind?: "cruise" | "sailing" | "ship" | "cabin_category";
  [key: string]: unknown;
};

export type ConnectCruiseAdapterOptions = {
  client?: VoyantConnectClient;
  connect?: VoyantConnectClientOptions;
  sourceProvider?: string;
  operatorId?: string;
  connectionIds?: string[];
  providerKeys?: string[];
  locale?: string;
  quoteTtlHours?: number;
  version?: string;
};

export type ExternalCruiseType = "ocean" | "river" | "expedition" | "coastal";
export type ExternalShipType = ExternalCruiseType | "yacht" | "sailing";
export type ExternalSalesStatus =
  | "open"
  | "on_request"
  | "wait_list"
  | "sold_out"
  | "closed";

export type ConnectExternalCruiseSummary = {
  sourceRef: ConnectCruiseSourceRef;
  name: string;
  slug: string;
  cruiseType: ExternalCruiseType;
  lineName: string;
  shipName?: string;
  nights: number;
  // Sailing rollup lifted from the catalog projection so a browse card can show
  // "N departures / from <date>" without a per-cruise sailings fetch.
  // `nextDeparture` is the soonest departure on/after the catalog's last sync
  // (null once all are past); `earliestDeparture` is the stable soonest-overall.
  earliestDeparture?: string | null;
  nextDeparture?: string | null;
  departureCount?: number | null;
  lowestPrice?: string | null;
  lowestPriceCurrency?: string | null;
  heroImageUrl?: string | null;
};

export type ConnectCruiseSearchProjectionEntry =
  ConnectExternalCruiseSummary & {
    shipName: string;
    // External ids so downstream catalog field policies can bind supplier/ship
    // columns to ids (not just the display names).
    lineExternalId: string;
    shipExternalId: string;
    embarkPortName?: string | null;
    disembarkPortName?: string | null;
    regions?: string[];
    themes?: string[];
    latestDeparture?: string | null;
    salesStatus?: string | null;
    // Canonical geography resolved via the data-geo product, carried on the
    // catalog projection. The id arrays are stable facet/filter keys
    // (`river:Q1653`, `HU`); the parallel name arrays are facet labels in the
    // catalog locale. Downstream catalog adapters index these for destination
    // faceting.
    regionIds?: string[];
    waterwayIds?: string[];
    portIds?: string[];
    countryIso?: string[];
    waterways?: string[];
    ports?: string[];
    countries?: string[];
  };

export type ConnectExternalCruise = {
  sourceRef: ConnectCruiseSourceRef;
  name: string;
  slug: string;
  cruiseType: ExternalCruiseType;
  lineName: string;
  defaultShipRef?: ConnectCruiseSourceRef;
  nights: number;
  embarkPortName?: string | null;
  disembarkPortName?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  highlights?: string[];
  regions?: string[];
  themes?: string[];
  heroImageUrl?: string | null;
  status?: "draft" | "awaiting_review" | "live" | "archived";
};

export type ConnectExternalSailing = {
  sourceRef: ConnectCruiseSourceRef;
  cruiseRef: ConnectCruiseSourceRef;
  shipRef: ConnectCruiseSourceRef;
  departureDate: string;
  returnDate: string;
  embarkPortName?: string | null;
  disembarkPortName?: string | null;
  salesStatus?: ExternalSalesStatus;
  // Cheapest bookable price (minor units) for the sailing. The platform's
  // rollup already computes it onto the sailing row, so departure prices need
  // no per-sailing pricing fetch.
  lowestPriceCents?: number | null;
};

export type ExternalRoomType =
  | "inside"
  | "oceanview"
  | "balcony"
  | "suite"
  | "penthouse"
  | "single";

export type ConnectExternalCabinCategory = {
  sourceRef: ConnectCruiseSourceRef;
  code: string;
  name: string;
  roomType: ExternalRoomType;
  description?: string | null;
  // Provider booking/pricing grades that roll up to this one bookable category
  // (e.g. `DV1`..`DV6` under `DV`); pricing stays per grade via the fare code.
  gradeCodes?: string[];
  minOccupancy: number;
  maxOccupancy: number;
  squareFeet?: string | null;
  wheelchairAccessible?: boolean;
  amenities?: string[];
  images?: string[];
  // Floor-plan / room-layout schematics, distinct from the photo gallery.
  // Named to match the cruise vertical's `ExternalCabinCategory.floorplanImages`.
  floorplanImages?: string[];
};

export type ConnectExternalShipDeck = {
  name: string;
  planImageUrl: string;
};

export type ConnectExternalShip = {
  sourceRef: ConnectCruiseSourceRef;
  name: string;
  slug: string;
  shipType: ExternalShipType;
  capacityGuests?: number | null;
  cabinCount?: number | null;
  deckCount?: number | null;
  yearBuilt?: number | null;
  yearRefurbished?: number | null;
  description?: string | null;
  deckPlanUrl?: string | null;
  decks?: ConnectExternalShipDeck[];
  gallery?: string[];
  amenities?: Record<string, unknown>;
  categories?: ConnectExternalCabinCategory[];
};

export type ConnectExternalPriceRow = {
  cabinCategoryRef: ConnectCruiseSourceRef;
  occupancy: number;
  fareCode?: string | null;
  currency: string;
  pricePerPerson: string;
  availability:
    | "available"
    | "limited"
    | "on_request"
    | "wait_list"
    | "sold_out";
  components?: Array<{
    kind: CruiseFareComponentKind;
    label?: string | null;
    amount: string;
    currency: string;
    direction: "addition" | "inclusion" | "credit";
    perPerson: boolean;
  }>;
};

export type ConnectExternalItineraryDay = {
  dayNumber: number;
  title?: string | null;
  description?: string | null;
  portName?: string | null;
  arrivalTime?: string | null;
  departureTime?: string | null;
  isOvernight?: boolean;
  isSeaDay?: boolean;
  meals?: { breakfast?: boolean; lunch?: boolean; dinner?: boolean };
};

export type ConnectExternalBookingInput = {
  sailingRef: ConnectCruiseSourceRef;
  cabinCategoryRef: ConnectCruiseSourceRef;
  occupancy: number;
  fareCode?: string | null;
  passengers: Array<{
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    travelerCategory?: "adult" | "child" | "infant" | "senior" | "other" | null;
    isPrimary?: boolean;
  }>;
  contact: {
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
  };
  notes?: string | null;
};

export type ConnectExternalBookingResult = {
  connectorBookingRef: string;
  connectorStatus?: string | null;
};

export type ConnectCruiseAdapter = {
  readonly name: string;
  readonly version: string;
  listEntries(options?: { limit?: number; cursor?: string }): Promise<{
    entries: ConnectExternalCruiseSummary[];
    nextCursor?: string;
  }>;
  searchProjection(options?: {
    limit?: number;
    cursor?: string;
  }): AsyncIterable<ConnectCruiseSearchProjectionEntry>;
  fetchCruise(
    sourceRef: ConnectCruiseSourceRef,
  ): Promise<ConnectExternalCruise | null>;
  fetchSailing(
    sourceRef: ConnectCruiseSourceRef,
  ): Promise<ConnectExternalSailing | null>;
  fetchSailingPricing(
    sourceRef: ConnectCruiseSourceRef,
  ): Promise<ConnectExternalPriceRow[]>;
  fetchSailingItinerary(
    sourceRef: ConnectCruiseSourceRef,
  ): Promise<ConnectExternalItineraryDay[]>;
  fetchShip(
    sourceRef: ConnectCruiseSourceRef,
  ): Promise<ConnectExternalShip | null>;
  listSailingsForCruise(
    cruiseRef: ConnectCruiseSourceRef,
  ): Promise<ConnectExternalSailing[]>;
  createBooking(
    input: ConnectExternalBookingInput,
  ): Promise<ConnectExternalBookingResult>;
};

export class ConnectCruisesNotImplementedError extends Error {
  constructor(method: string, detail: string) {
    super(`@voyant-travel/connect-cruises cannot ${method}: ${detail}`);
    this.name = "ConnectCruisesNotImplementedError";
  }
}

export function createConnectCruiseAdapter(
  options: ConnectCruiseAdapterOptions,
): ConnectCruiseAdapter {
  const client = options.client ?? createClient(options);
  const sourceProvider = options.sourceProvider ?? "connect";
  const version = options.version ?? "0.1.0";

  return {
    name: sourceProvider,
    version,

    async listEntries(listOptions) {
      const rows = await client.cruises.list({
        operatorId: options.operatorId,
        connectionId: options.connectionIds,
        providerKey: options.providerKeys,
        locale: options.locale,
        limit: listOptions?.limit,
      });
      return {
        entries: rows.map(toSummary),
        nextCursor: undefined,
      };
    },

    async *searchProjection(listOptions) {
      const rows = await client.cruises.list({
        operatorId: options.operatorId,
        connectionId: options.connectionIds,
        providerKey: options.providerKeys,
        locale: options.locale,
        limit: listOptions?.limit,
      });
      for (const row of rows) {
        yield toSearchProjection(row);
      }
    },

    async fetchCruise(sourceRef) {
      const row = await client.cruises.getOnConnection(
        requireConnectionId(sourceRef),
        sourceRef.externalId,
        {
          locale: options.locale,
        },
      );
      return toCruise(sourceRef, row);
    },

    async fetchSailing(sourceRef) {
      const row = await client.cruises.getSailingOnConnection(
        requireConnectionId(sourceRef),
        sourceRef.externalId,
      );
      return toSailing(sourceRef, row);
    },

    async fetchSailingPricing(sourceRef) {
      const rows = await client.cruises.listSailingPricing(
        requireConnectionId(sourceRef),
        sourceRef.externalId,
      );
      return rows.map(toPriceRow);
    },

    async fetchSailingItinerary(sourceRef) {
      const rows = await client.cruises.listItinerary(
        requireConnectionId(sourceRef),
        sourceRef.externalId,
      );
      return rows.map((row) => ({
        dayNumber: row.dayNumber,
        title: row.title,
        // The per-day narrative lives in payload.description; `title` is the
        // port name (don't substitute it for the description).
        description: getString(row.payload, "description") ?? null,
        portName: row.portName,
        arrivalTime: row.arriveAt,
        departureTime: row.departAt,
        isOvernight: row.isOvernight,
        isSeaDay: row.isSeaDay,
      }));
    },

    async fetchShip(sourceRef) {
      const connectionId = requireConnectionId(sourceRef);
      const row = await client.cruises.getShip(
        connectionId,
        sourceRef.externalId,
      );
      const ship = toShip(sourceRef, row);
      if (!ship) return null;
      // The ship read doesn't include cabin categories; fetch and attach them
      // so the content's "Options" tab + cabin pricing have a catalog to bind.
      const cabinRows = await client.cruises.listCabinCategories(
        connectionId,
        sourceRef.externalId,
        { locale: options.locale },
      );
      ship.categories = cabinRows.map((cabin) =>
        toCabinCategory(connectionId, cabin),
      );
      return ship;
    },

    async listSailingsForCruise(cruiseRef) {
      const connectionId = requireConnectionId(cruiseRef);
      const rows = await client.cruises.listSailingsOnConnection(
        connectionId,
        {
          cruiseExternalId: cruiseRef.externalId,
          limit: 500,
        },
      );
      return rows
        .map((row) =>
          toSailing(sourceRefFromRow(row, connectionId, "sailing"), row),
        )
        .filter(
          (sailing): sailing is ConnectExternalSailing => sailing !== null,
        );
    },

    async createBooking(input) {
      const quoteId =
        getString(input.cabinCategoryRef, "quoteId") ??
        (await createQuoteForBooking(client, input, options.quoteTtlHours));
      const result = await client.cruiseBookings.confirm(
        requireConnectionId(input.sailingRef),
        {
          quoteId,
          leadPassenger: toLeadPassenger(input),
          contact: {
            email: input.contact.email ?? "",
            phone: input.contact.phone ?? undefined,
          },
          passengers: input.passengers.map((passenger) => ({
            type: passengerTypeFromTravelerCategory(passenger.travelerCategory),
            firstName: passenger.firstName,
            lastName: passenger.lastName,
            email: passenger.email ?? undefined,
            phone: passenger.phone ?? undefined,
          })),
          notes: input.notes ?? undefined,
        } satisfies CruiseConfirmInput,
      );
      return {
        connectorBookingRef: result.externalReference ?? result.reference,
        connectorStatus: result.status,
      };
    },
  };
}

async function createQuoteForBooking(
  client: VoyantConnectClient,
  input: ConnectExternalBookingInput,
  quoteTtlHours: number | undefined,
): Promise<string> {
  const quote = await client.cruiseBookings.lockSelection(
    requireConnectionId(input.sailingRef),
    {
      sailingExternalId: input.sailingRef.externalId,
      cabinCategoryExternalId: input.cabinCategoryRef.externalId,
      fareCode: input.fareCode ?? undefined,
      occupancy: occupancyFromBookingInput(input),
      ttlHours: quoteTtlHours,
    },
  );
  return quote.id;
}

function createClient(
  options: ConnectCruiseAdapterOptions,
): VoyantConnectClient {
  if (!options.connect) {
    throw new Error(
      "createConnectCruiseAdapter requires either client or connect options",
    );
  }
  return createVoyantConnectClient(options.connect);
}

function toSummary(row: OperatorCruiseSummary): ConnectExternalCruiseSummary {
  const projection = (row.projection ?? {}) as JsonObject;
  // The catalog projection's sailing rollup (count + next/earliest departure),
  // null when the cruise has no sailings or the catalog predates the rollup.
  const sailings = (projection.sailings ?? {}) as JsonObject;
  return {
    sourceRef: sourceRefFromOperatorCruise(row, "cruise"),
    name: row.name,
    slug: row.slug ?? slugify(row.name),
    cruiseType: normalizeCruiseType(row.cruiseType),
    lineName: row.supplierName || row.cruiseLineExternalId,
    // Prefer the resolved ship name from the projection; fall back to the id.
    shipName: getString(projection, "shipName") ?? row.shipExternalId,
    nights: row.nights,
    // Lift the sailing rollup so browse cards get departures without a fetch.
    earliestDeparture: getString(sailings, "earliestDeparture") ?? null,
    nextDeparture: getString(sailings, "nextDeparture") ?? null,
    departureCount: getNumber(sailings, "count"),
    // Lift the catalog's "from" price (stored in minor units) onto the summary.
    lowestPrice:
      row.priceFromAmountMinor != null
        ? (row.priceFromAmountMinor / 100).toFixed(2)
        : null,
    lowestPriceCurrency: row.priceFromCurrency,
    // The cover lives in media[].url (the projection's computed heroImageUrl, or
    // the payload's media), not payload.heroImageUrl.
    heroImageUrl:
      getString(projection, "heroImageUrl") ??
      firstMediaUrl(row.payload) ??
      getString(row.payload, "heroImageUrl"),
  };
}

function toSearchProjection(
  row: OperatorCruiseSummary,
): ConnectCruiseSearchProjectionEntry {
  // Canonical geography rides on the catalog projection (data-geo resolved at
  // sync). Lift it onto the entry so downstream catalog adapters can index it
  // for destination faceting.
  const projection = (row.projection ?? {}) as JsonObject;
  // The catalog projection is camelCase (schema v2); fall back to the legacy
  // snake_case keys so this keeps working against an un-migrated catalog.
  const geo = (camelKey: string, snakeKey: string): string[] | undefined => {
    const camel = getStringArray(projection, camelKey);
    if (camel && camel.length > 0) return camel;
    return getStringArray(projection, snakeKey);
  };
  const summary = toSummary(row);
  return {
    ...summary,
    shipName: summary.shipName ?? row.shipExternalId,
    lineExternalId: row.cruiseLineExternalId,
    shipExternalId: row.shipExternalId,
    embarkPortName: row.embarkationPortCode,
    disembarkPortName: row.disembarkationPortCode,
    regions: row.destinations ?? undefined,
    themes: undefined,
    latestDeparture: null,
    salesStatus: row.status,
    regionIds: geo("regionIds", "region_ids"),
    waterwayIds: geo("waterwayIds", "waterway_ids"),
    portIds: geo("portIds", "port_ids"),
    countryIso: geo("countryIso", "country_iso"),
    waterways: getStringArray(projection, "waterways"),
    ports: getStringArray(projection, "ports"),
    countries: getStringArray(projection, "countries"),
  };
}

function toCruise(
  sourceRef: ConnectCruiseSourceRef,
  row: JsonObject,
): ConnectExternalCruise | null {
  // The read endpoint returns the cruise row: structural columns are top-level
  // (shipExternalId, embarkationPortCode, …) but the rich content (description,
  // highlights, ports, media) lives under `payload`. Read payload first, fall
  // back to the column.
  const payload = getRowPayload(row);
  const name = getString(row, "name") ?? getString(payload, "name");
  if (!name) return null;
  return {
    sourceRef,
    name,
    slug: getString(row, "slug") ?? getString(payload, "slug") ?? slugify(name),
    cruiseType: normalizeCruiseType(
      getString(row, "cruiseType") ?? getString(payload, "cruiseType"),
    ),
    lineName:
      getString(row, "supplierName") ??
      getString(payload, "cruiseLineName") ??
      getString(row, "cruiseLineExternalId") ??
      "Cruise line",
    defaultShipRef: sourceRefFromMaybe(
      row,
      "shipExternalId",
      sourceRef.connectionId,
      "ship",
    ),
    nights: getNumber(row, "nights") ?? getNumber(payload, "nights") ?? 0,
    embarkPortName:
      getNestedString(payload, "embarkationPort", "name") ??
      getString(row, "embarkationPortCode"),
    disembarkPortName:
      getNestedString(payload, "disembarkationPort", "name") ??
      getString(row, "disembarkationPortCode"),
    description:
      getString(payload, "description") ?? getString(row, "description"),
    shortDescription:
      getString(payload, "summary") ?? getString(payload, "shortDescription"),
    highlights:
      getStringArray(payload, "highlights") ??
      getStringArray(row, "highlights"),
    regions:
      getStringArray(row, "destinations") ??
      getStringArray(payload, "destinations"),
    heroImageUrl: firstMediaUrl(payload) ?? getString(payload, "heroImageUrl"),
    status: "live",
  };
}

function toSailing(
  sourceRef: ConnectCruiseSourceRef,
  row: JsonObject,
): ConnectExternalSailing | null {
  const departureDate = getString(row, "departureDate");
  const returnDate = getString(row, "returnDate");
  if (!departureDate || !returnDate) return null;
  return {
    sourceRef,
    cruiseRef: sourceRefFromMaybe(
      row,
      "cruiseId",
      sourceRef.connectionId,
      "cruise",
    ) ?? {
      connectionId: sourceRef.connectionId,
      externalId: getString(row, "cruiseExternalId") ?? "",
      kind: "cruise",
    },
    shipRef: sourceRefFromMaybe(
      row,
      "shipId",
      sourceRef.connectionId,
      "ship",
    ) ?? {
      connectionId: sourceRef.connectionId,
      externalId: getString(row, "shipExternalId") ?? "",
      kind: "ship",
    },
    departureDate,
    returnDate,
    embarkPortName:
      getNestedString(getRowPayload(row), "embarkationPort", "name") ??
      getNestedString(row, "embarkationPort", "name") ??
      getString(row, "embarkationPortCode"),
    disembarkPortName:
      getNestedString(getRowPayload(row), "disembarkationPort", "name") ??
      getNestedString(row, "disembarkationPort", "name") ??
      getString(row, "disembarkationPortCode"),
    salesStatus: normalizeSalesStatus(getString(row, "salesStatus")),
    // The sailing list/read already carries the rollup's from-price.
    lowestPriceCents: getNumber(row, "priceFromAmountMinor"),
  };
}

function toShip(
  sourceRef: ConnectCruiseSourceRef,
  row: JsonObject,
): ConnectExternalShip | null {
  const payload = getRowPayload(row);
  const name = getString(row, "name") ?? getString(payload, "name");
  if (!name) return null;
  const gallery = galleryUrls(payload);
  return {
    sourceRef,
    name,
    slug: getString(row, "slug") ?? getString(payload, "slug") ?? slugify(name),
    shipType: normalizeShipType(
      getString(row, "shipType") ?? getString(payload, "shipType"),
    ),
    capacityGuests:
      getNumber(row, "capacityGuests") ?? getNumber(payload, "capacityGuests"),
    cabinCount:
      getNumber(row, "cabinCount") ?? getNumber(payload, "cabinCount"),
    deckCount: getNumber(row, "deckCount") ?? getNumber(payload, "deckCount"),
    yearBuilt: getNumber(row, "yearBuilt") ?? getNumber(payload, "yearBuilt"),
    yearRefurbished:
      getNumber(row, "yearRefurbished") ??
      getNumber(payload, "yearRefurbished"),
    description:
      getString(row, "description") ?? getString(payload, "description"),
    deckPlanUrl:
      getString(row, "deckPlanUrl") ?? getString(payload, "deckPlanUrl"),
    decks: shipDecks(payload),
    // The ship's gallery lives under payload.images[].url (a Ship has no
    // top-level `media`), so read from the payload, with a top-level fallback.
    gallery: gallery.length > 0 ? gallery : mediaUrls(row),
  };
}

function shipDecks(payload: JsonObject): ConnectExternalShipDeck[] | undefined {
  const decks = payload.decks;
  if (!Array.isArray(decks)) return undefined;
  const mapped: ConnectExternalShipDeck[] = [];
  for (const item of decks) {
    if (!item || typeof item !== "object") continue;
    const planImageUrl = getString(item as JsonObject, "imageUrl");
    const name = getString(item as JsonObject, "name");
    // The vertical's `ExternalDeck` requires a name and reads `planImageUrl`;
    // skip decks missing either so we never emit non-conformant entries.
    if (!name || !planImageUrl) continue;
    mapped.push({ name, planImageUrl });
  }
  return mapped.length > 0 ? mapped : undefined;
}

function toCabinCategory(
  connectionId: string,
  row: JsonObject,
): ConnectExternalCabinCategory {
  const payload = getRowPayload(row);
  const occupancy = (payload.maxOccupancy ?? {}) as JsonObject;
  const area = (payload.area ?? {}) as JsonObject;
  const squareFeet =
    getString(area, "unit") === "sqft" && getNumber(area, "value") !== null
      ? String(getNumber(area, "value"))
      : null;
  return {
    sourceRef: {
      connectionId,
      externalId: getString(row, "externalId") ?? "",
      kind: "cabin_category",
    },
    code: getString(row, "code") ?? getString(payload, "code") ?? "",
    name: getString(row, "name") ?? getString(payload, "name") ?? "",
    roomType: normalizeRoomType(
      getString(row, "roomType") ?? getString(payload, "roomType"),
    ),
    description: getString(payload, "description"),
    gradeCodes: getStringArray(payload, "gradeCodes"),
    minOccupancy: 1,
    maxOccupancy:
      getNumber(row, "maxTotal") ?? getNumber(occupancy, "total") ?? 2,
    squareFeet,
    wheelchairAccessible:
      typeof payload.wheelchairAccessible === "boolean"
        ? payload.wheelchairAccessible
        : undefined,
    amenities:
      getStringArray(payload, "features") ??
      getStringArray(payload, "amenities"),
    images: galleryUrls(payload),
    // Emit as `floorplanImages` (the vertical's field) from the upstream
    // `roomLayoutImages` payload key so cabin floorplans aren't dropped.
    floorplanImages: urlArray(payload, "roomLayoutImages"),
  };
}

// Image urls from an array of `{ url }` objects (or bare strings) under `key`.
function urlArray(record: JsonObject, key: string): string[] | undefined {
  const arr = record[key];
  if (!Array.isArray(arr)) return undefined;
  const urls: string[] = [];
  for (const item of arr) {
    if (item && typeof item === "object") {
      const url = getString(item as JsonObject, "url");
      if (url) urls.push(url);
    } else if (typeof item === "string") {
      urls.push(item);
    }
  }
  return urls.length > 0 ? urls : undefined;
}

function toPriceRow(row: CabinPricing): ConnectExternalPriceRow {
  return {
    cabinCategoryRef: {
      connectionId: row.connectionId,
      externalId: row.cabinCategoryId,
      kind: "cabin_category",
    },
    occupancy: passengerCountFromConnectOccupancy(row.occupancy),
    fareCode: row.fareCode ?? null,
    currency: row.pricePerPerson.currency,
    pricePerPerson: moneyToDecimal(row.pricePerPerson),
    availability: row.availability,
    components: row.components.map((component) => ({
      kind: component.kind,
      label: component.label ?? null,
      amount: connectFareComponentAmount(component),
      currency: component.amount.currency,
      direction: "addition",
      perPerson: false,
    })),
  };
}

function sourceRefFromOperatorCruise(
  row: OperatorCruiseSummary,
  kind: ConnectCruiseSourceRef["kind"],
): ConnectCruiseSourceRef {
  return {
    connectionId: row.connectionId,
    providerKey: row.providerKey,
    externalId: row.externalId,
    kind,
  };
}

function requireConnectionId(ref: ConnectCruiseSourceRef): string {
  if (!ref.connectionId) {
    throw new Error(
      "@voyant-travel/connect-cruises requires a connectionId on the source ref",
    );
  }
  return ref.connectionId;
}

function sourceRefFromRow(
  row: JsonObject,
  connectionId: string | undefined,
  kind: ConnectCruiseSourceRef["kind"],
): ConnectCruiseSourceRef {
  return {
    connectionId,
    externalId: getString(row, "externalId") ?? getString(row, "id") ?? "",
    kind,
  };
}

function sourceRefFromMaybe(
  row: JsonObject,
  field: string,
  connectionId: string | undefined,
  kind: ConnectCruiseSourceRef["kind"],
): ConnectCruiseSourceRef | undefined {
  const externalId = getString(row, field);
  if (!externalId) return undefined;
  return { connectionId, externalId, kind };
}

function toLeadPassenger(input: ConnectExternalBookingInput): CruisePassenger {
  const lead =
    input.passengers.find((passenger) => passenger.isPrimary) ??
    input.passengers[0];
  if (!lead) {
    throw new Error("createBooking requires at least one passenger");
  }
  return {
    type: passengerTypeFromTravelerCategory(lead.travelerCategory),
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email ?? undefined,
    phone: lead.phone ?? undefined,
  };
}

function occupancyFromBookingInput(
  input: ConnectExternalBookingInput,
): CruisePassengerOccupancy {
  let adults = 0;
  let children = 0;
  let infants = 0;

  for (const passenger of input.passengers) {
    const type = passengerTypeFromTravelerCategory(passenger.travelerCategory);
    if (type === "child") {
      children += 1;
    } else if (type === "infant") {
      infants += 1;
    } else {
      adults += 1;
    }
  }

  if (input.passengers.length === 0) {
    throw new Error("createBooking requires at least one passenger");
  }

  if (adults === 0) {
    adults = Math.max(1, input.occupancy - children - infants);
  }

  return {
    adults,
    ...(children > 0 ? { children } : {}),
    ...(infants > 0 ? { infants } : {}),
  };
}

function passengerTypeFromTravelerCategory(
  category: ConnectExternalBookingInput["passengers"][number]["travelerCategory"],
): "adult" | "child" | "infant" {
  if (category === "child") return "child";
  if (category === "infant") return "infant";
  return "adult";
}

function normalizeCruiseType(value: unknown): ExternalCruiseType {
  if (value === "river" || value === "expedition" || value === "coastal")
    return value;
  return "ocean";
}

function normalizeShipType(value: unknown): ExternalShipType {
  if (
    value === "river" ||
    value === "expedition" ||
    value === "coastal" ||
    value === "yacht" ||
    value === "sailing"
  ) {
    return value;
  }
  return "ocean";
}

function normalizeRoomType(value: unknown): ExternalRoomType {
  if (
    value === "oceanview" ||
    value === "balcony" ||
    value === "suite" ||
    value === "penthouse" ||
    value === "single"
  ) {
    return value;
  }
  // `studio` (solo cabins) isn't in the catalog room-type set — treat as single.
  if (value === "studio") return "single";
  return "inside";
}

function normalizeSalesStatus(value: unknown): ExternalSalesStatus {
  if (
    value === "on_request" ||
    value === "wait_list" ||
    value === "sold_out" ||
    value === "closed"
  ) {
    return value;
  }
  return "open";
}

function getString(record: JsonObject, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function getNumber(record: JsonObject, key: string): number | null {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getStringArray(record: JsonObject, key: string): string[] | undefined {
  const value = record[key];
  if (!Array.isArray(value)) return undefined;
  const strings = value.filter(
    (item): item is string => typeof item === "string",
  );
  return strings.length > 0 ? strings : undefined;
}

function getNestedString(
  record: JsonObject,
  key: string,
  nestedKey: string,
): string | null {
  const nested = record[key];
  if (!nested || typeof nested !== "object") return null;
  return getString(nested as JsonObject, nestedKey) ?? null;
}

function getRowPayload(record: JsonObject): JsonObject {
  const payload = record.payload;
  return payload && typeof payload === "object" ? (payload as JsonObject) : {};
}

function mediaUrls(record: JsonObject): string[] {
  const media = record.media;
  if (!Array.isArray(media)) return [];
  return media
    .map((item) =>
      item && typeof item === "object"
        ? getString(item as JsonObject, "url")
        : undefined,
    )
    .filter((url): url is string => Boolean(url));
}

// Collect image urls from any of the array shapes a payload may use for a
// gallery (`images` for ships, `media` for cruises), de-duplicated.
function galleryUrls(record: JsonObject): string[] {
  const urls = new Set<string>();
  for (const key of ["images", "media", "gallery"]) {
    const arr = record[key];
    if (!Array.isArray(arr)) continue;
    for (const item of arr) {
      if (item && typeof item === "object") {
        const url = getString(item as JsonObject, "url");
        if (url) urls.add(url);
      } else if (typeof item === "string") {
        urls.add(item);
      }
    }
  }
  return [...urls];
}

function firstMediaUrl(record: JsonObject): string | null {
  return mediaUrls(record)[0] ?? null;
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "cruise"
  );
}

export function passengerCountFromConnectOccupancy(
  occupancy: CruisePassengerOccupancy,
): number {
  return (
    occupancy.adults + (occupancy.children ?? 0) + (occupancy.infants ?? 0)
  );
}

export function connectFareComponentAmount(
  component: CruiseFareComponent,
): string {
  return (component.amount.amountMinor / 100).toFixed(2);
}

function moneyToDecimal(money: {
  amountMinor: number;
  currencyPrecision: number;
}): string {
  return (money.amountMinor / 10 ** money.currencyPrecision).toFixed(
    money.currencyPrecision,
  );
}

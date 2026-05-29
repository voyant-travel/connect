import {
  createVoyantConnectClient,
  type ConnectAvailabilityQuery,
  type CreateBookingInput,
  type CruiseConfirmInput,
  type CruiseLockSelectionInput,
  type CruiseSearchQuery,
  type SearchDocument,
  type StayConfirmInput,
  type StaySearchQuery,
  type VoyantConnectClient,
  type VoyantConnectClientOptions,
} from "@voyantjs/connect-sdk";

type JsonRecord = Record<string, unknown>;

export interface AdapterCapabilities {
  verticals: string[];
  supportsLiveResolution: boolean;
  supportsDriftDetection: boolean;
  supportsBookingForwarding: boolean;
  supportsReservationRetrieval?: boolean;
  supportsSyncCancellation?: boolean;
  postBookOperations: ReadonlyArray<
    "modify" | "cancel" | "status" | "refund" | "exchange" | "void"
  >;
  cacheTtlSeconds?: number | null;
  supportsContentFetch?: boolean;
  supportedContentLocales?: ReadonlyArray<string>;
  ownsContentCache?: boolean;
  ownsAvailabilityCache?: boolean;
  holdReleaseGraceMs?: number;
}

export type ConnectionState = "active" | "paused" | "disconnected" | "error";

export interface SourceAdapterContext {
  connection_id: string;
  credentials?: Record<string, string>;
  tenant_id?: string;
  correlation_id?: string;
}

export type SourceFreshness = "sync" | "event" | "request" | "static" | null;

export interface Provenance {
  source_kind: string;
  source_provider?: string;
  source_connection_id?: string;
  source_ref?: string;
  source_freshness: SourceFreshness;
  last_sourced_at?: Date;
}

export interface CatalogProjection {
  entity_module: string;
  entity_id: string;
  provenance: Provenance;
  fields: JsonRecord;
}

export type DiscoveryCursor = string | undefined;

export interface DiscoveryPage {
  projections: CatalogProjection[];
  next_cursor: DiscoveryCursor;
}

export interface SourceAdapterRequestScope {
  locale: string;
  audience: string;
  market: string;
  currency?: string;
}

export interface LiveResolveRequest {
  ids: string[];
  scope: SourceAdapterRequestScope;
  parameters?: JsonRecord;
}

export interface LiveResolveResult {
  values: Record<string, JsonRecord>;
  failed?: Record<
    string,
    | "timeout"
    | "not_found"
    | "unavailable"
    | "departure_not_found"
    | "departure_unavailable"
    | "unsupported"
    | "error"
  >;
}

export interface GetContentRequest {
  entity_module: string;
  entity_id: string;
  locale: string;
  market?: string;
  currency?: string;
}

export interface GetContentResult {
  entity_module: string;
  entity_id: string;
  source_ref: string;
  returned_locale: string;
  machine_translated?: boolean;
  content: unknown;
  content_schema_version: string;
  source_updated_at?: Date;
  fresh_until?: Date;
  etag?: string;
}

export interface ReserveRequest {
  entity_module: string;
  entity_id: string;
  parameters: JsonRecord;
  party?: JsonRecord;
  payment_intent?: JsonRecord;
  scope?: SourceAdapterRequestScope;
  idempotency_key?: string;
}

export interface ReserveResult {
  upstream_ref: string;
  status: "held" | "confirmed" | "ticketed" | "failed";
  upstream_payload?: JsonRecord;
}

export interface CancelRequest {
  upstream_ref: string;
  reason?: string;
  scope?: SourceAdapterRequestScope;
  idempotency_key?: string;
}

export interface CancelResult {
  status: "cancelled" | "pending" | "refused" | "failed";
  refund_amount?: number;
  refund_currency?: string;
  pending_channel?: string;
}

export type ReservationStatus =
  | ReserveResult["status"]
  | CancelResult["status"]
  | "cancelling";

export interface GetReservationRequest {
  upstream_ref: string;
  scope?: SourceAdapterRequestScope;
}

export interface GetReservationResult {
  upstream_ref: string;
  status: ReservationStatus;
  source_updated_at?: Date;
  upstream_payload?: JsonRecord;
}

export interface ListReservationsQuery {
  cursor?: DiscoveryCursor;
  limit?: number;
  status?: ReadonlyArray<ReservationStatus>;
  updated_after?: Date;
  scope?: SourceAdapterRequestScope;
}

export interface ListReservationsPage {
  reservations: GetReservationResult[];
  next_cursor: DiscoveryCursor;
}

export interface SourceAdapter {
  readonly kind: string;
  readonly capabilities: AdapterCapabilities;
  connect?(ctx: SourceAdapterContext): Promise<void>;
  pause?(ctx: SourceAdapterContext): Promise<void>;
  disconnect?(ctx: SourceAdapterContext): Promise<void>;
  getState?(ctx: SourceAdapterContext): Promise<ConnectionState>;
  discover?(
    ctx: SourceAdapterContext,
    cursor?: DiscoveryCursor,
  ): Promise<DiscoveryPage>;
  freshnessCheck?(
    ctx: SourceAdapterContext,
    entity_id: string,
  ): Promise<{ etag: string; updated_at: Date } | undefined>;
  liveResolve?(
    ctx: SourceAdapterContext,
    request: LiveResolveRequest,
  ): Promise<LiveResolveResult>;
  getContent?(
    ctx: SourceAdapterContext,
    request: GetContentRequest,
  ): Promise<GetContentResult>;
  reserve?(
    ctx: SourceAdapterContext,
    request: ReserveRequest,
  ): Promise<ReserveResult>;
  cancel?(
    ctx: SourceAdapterContext,
    request: CancelRequest,
  ): Promise<CancelResult>;
  getReservation?(
    ctx: SourceAdapterContext,
    request: GetReservationRequest,
  ): Promise<GetReservationResult | null>;
  listReservations?(
    ctx: SourceAdapterContext,
    query: ListReservationsQuery,
  ): Promise<ListReservationsPage>;
}

export interface VoyantConnectSourceAdapterOptions {
  client?: VoyantConnectClient;
  connect?: VoyantConnectClientOptions;
  operatorId?: string;
  sourceKind?: string;
  sourceProvider?: string;
  connectionIds?: string[];
  market?: string;
  discoverLimit?: number;
  capabilities?: Partial<AdapterCapabilities>;
  mapDocument?: (
    document: SearchDocument,
    defaults: ProjectionDefaults,
  ) => CatalogProjection | null;
  liveResolve?: (
    ctx: SourceAdapterContext,
    request: LiveResolveRequest,
    client: VoyantConnectClient,
  ) => Promise<LiveResolveResult>;
  getContent?: (
    ctx: SourceAdapterContext,
    request: GetContentRequest,
    client: VoyantConnectClient,
  ) => Promise<GetContentResult>;
  reserve?: (
    ctx: SourceAdapterContext,
    request: ReserveRequest,
    client: VoyantConnectClient,
  ) => Promise<ReserveResult>;
  cancel?: (
    ctx: SourceAdapterContext,
    request: CancelRequest,
    client: VoyantConnectClient,
  ) => Promise<CancelResult>;
}

export interface ProjectionDefaults {
  sourceKind: string;
  sourceProvider?: string;
  connectionId: string;
}

export function createVoyantConnectSourceAdapter(
  options: VoyantConnectSourceAdapterOptions,
): SourceAdapter {
  const client = options.client ?? createClient(options);
  const sourceKind = options.sourceKind ?? "voyant-connect";
  const capabilities = mergeCapabilities(options.capabilities);

  return {
    kind: sourceKind,
    capabilities,

    async connect() {
      return undefined;
    },

    async pause() {
      return undefined;
    },

    async disconnect() {
      return undefined;
    },

    async getState(ctx) {
      const connection = await client.connections.get(
        resolveOperatorId(options),
        ctx.connection_id,
      );
      if (connection.status === "paused") return "paused";
      if (connection.status === "errored") return "error";
      if (connection.status === "active") return "active";
      return "disconnected";
    },

    async discover(ctx, cursor) {
      const connectionId = ctx.connection_id;
      const connectionIds = options.connectionIds ?? [connectionId];
      const documentPages = await Promise.all(
        connectionIds.map((id) =>
          client.operators.listSearchDocuments(resolveOperatorId(options), {
            connectionId: id,
            limit: options.discoverLimit,
            market: options.market,
            updatedSince: cursor,
          }),
        ),
      );
      const documents = documentPages.flat();
      const defaults = {
        sourceKind,
        sourceProvider: options.sourceProvider,
        connectionId,
      } satisfies ProjectionDefaults;
      return {
        projections: documents
          .map((document) =>
            (options.mapDocument ?? mapSearchDocumentToProjection)(
              document,
              defaults,
            ),
          )
          .filter(
            (projection): projection is CatalogProjection =>
              projection !== null,
          ),
        next_cursor: undefined,
      };
    },

    async freshnessCheck(ctx, entityId) {
      const documents = await client.operators.listSearchDocuments(
        resolveOperatorId(options),
        {
          connectionId: ctx.connection_id,
          limit: 1,
        },
      );
      const document = documents.find(
        (item) => item.id === entityId || item.payload.id === entityId,
      );
      if (!document) return undefined;
      return { etag: document.id, updated_at: new Date(document.updatedAt) };
    },

    async liveResolve(ctx, request) {
      if (options.liveResolve) return options.liveResolve(ctx, request, client);
      return liveResolveFromConnect(client, ctx, request);
    },

    async getContent(ctx, request) {
      if (options.getContent) return options.getContent(ctx, request, client);
      return getContentFromConnect(client, ctx, request);
    },

    async reserve(ctx, request) {
      if (options.reserve) return options.reserve(ctx, request, client);
      return reserveThroughConnect(client, ctx, request);
    },

    async cancel(ctx, request) {
      if (options.cancel) return options.cancel(ctx, request, client);
      return cancelThroughConnect(client, ctx, request);
    },

    async getReservation(ctx, request) {
      const ref = parseUpstreamRef(request.upstream_ref);
      const booking = await getBookingByRef(client, ctx.connection_id, ref);
      if (!booking) return null;
      return {
        upstream_ref: request.upstream_ref,
        status: reservationStatusFromConnect(getString(booking, "status")),
        source_updated_at: dateFromString(getString(booking, "updatedAt")),
        upstream_payload: booking,
      };
    },

    async listReservations(ctx, query) {
      const rows = await client.bookings.list(ctx.connection_id, {
        localDateStart: query.updated_after?.toISOString(),
      });
      return {
        reservations: rows.map((row) => ({
          upstream_ref: `booking:${getString(row, "id") ?? getString(row, "externalBookingId") ?? ""}`,
          status: reservationStatusFromConnect(getString(row, "status")),
          source_updated_at: dateFromString(getString(row, "updatedAt")),
          upstream_payload: row,
        })),
        next_cursor: undefined,
      };
    },
  };
}

export function mapSearchDocumentToProjection(
  document: SearchDocument,
  defaults: ProjectionDefaults,
): CatalogProjection | null {
  const payload = document.payload;
  if (isCatalogProjection(payload)) {
    return withProjectionDefaults(payload, document, defaults);
  }

  const entityId =
    getString(payload, "id") ?? getString(payload, "productId") ?? document.id;
  const source = getRecord(payload, "source");
  const freshness = getRecord(payload, "freshness");
  const sourceConnectionId =
    getString(source, "connectionId") ??
    getString(payload, "connectionId") ??
    document.connectionId ??
    defaults.connectionId;
  const sourceProvider =
    defaults.sourceProvider ?? getString(source, "providerKey");
  const refreshedAt = getString(freshness, "refreshedAt") ?? document.updatedAt;

  return {
    entity_module: categoryToEntityModule(getString(payload, "category")),
    entity_id: entityId,
    provenance: {
      source_kind: defaults.sourceKind,
      ...(sourceProvider ? { source_provider: sourceProvider } : {}),
      source_connection_id: sourceConnectionId,
      source_ref: getSourceRef(payload, entityId),
      source_freshness: "sync",
      ...(refreshedAt ? { last_sourced_at: new Date(refreshedAt) } : {}),
    },
    fields: {
      title: getString(payload, "title") ?? entityId,
      summary: getString(payload, "summary") ?? null,
      searchable_text: getString(payload, "searchableText") ?? "",
      destinations: getStringArray(payload, "destinations"),
      country_codes: getStringArray(payload, "countryCodes"),
      tags: getStringArray(payload, "tags"),
      image_url: getString(payload, "imageUrl") ?? null,
      price_from: payload.priceFrom ?? null,
      availability_status: getString(payload, "availabilityStatus") ?? null,
      market_context: payload.marketContext ?? document.market ?? null,
      connect_document: payload,
    },
  };
}

function mergeCapabilities(
  overrides: Partial<AdapterCapabilities> | undefined,
): AdapterCapabilities {
  return {
    verticals: ["products", "accommodations", "cruises", "stays", "flights"],
    supportsLiveResolution: true,
    supportsDriftDetection: false,
    supportsBookingForwarding: true,
    supportsReservationRetrieval: true,
    supportsSyncCancellation: true,
    postBookOperations: ["cancel", "status"],
    cacheTtlSeconds: 60,
    supportsContentFetch: true,
    ownsContentCache: false,
    ownsAvailabilityCache: true,
    ...overrides,
  };
}

function createClient(
  options: VoyantConnectSourceAdapterOptions,
): VoyantConnectClient {
  if (!options.connect) {
    throw new Error(
      "createVoyantConnectSourceAdapter requires either client or connect options",
    );
  }
  return createVoyantConnectClient(options.connect);
}

function resolveOperatorId(options: VoyantConnectSourceAdapterOptions): string {
  const operatorId =
    options.operatorId ??
    options.connect?.operatorId ??
    options.client?.defaultOperatorId;
  if (!operatorId) {
    throw new Error(
      "createVoyantConnectSourceAdapter requires operatorId for catalog discovery",
    );
  }
  return operatorId;
}

function withProjectionDefaults(
  projection: CatalogProjection,
  document: SearchDocument,
  defaults: ProjectionDefaults,
): CatalogProjection {
  const sourceConnectionId =
    projection.provenance.source_connection_id ??
    document.connectionId ??
    defaults.connectionId;
  return {
    ...projection,
    provenance: {
      ...projection.provenance,
      source_kind: projection.provenance.source_kind || defaults.sourceKind,
      ...(defaults.sourceProvider && !projection.provenance.source_provider
        ? { source_provider: defaults.sourceProvider }
        : {}),
      source_connection_id: sourceConnectionId,
      source_ref: projection.provenance.source_ref ?? document.id,
      source_freshness: projection.provenance.source_freshness ?? "sync",
    },
  };
}

async function liveResolveFromConnect(
  client: VoyantConnectClient,
  ctx: SourceAdapterContext,
  request: LiveResolveRequest,
): Promise<LiveResolveResult> {
  if (request.parameters?.connectRoute === "stays") {
    return liveResolveStays(client, ctx.connection_id, request);
  }
  if (request.parameters?.connectRoute === "cruises") {
    return liveResolveCruises(client, ctx.connection_id, request);
  }
  return liveResolveAvailability(client, ctx.connection_id, request);
}

async function liveResolveAvailability(
  client: VoyantConnectClient,
  connectionId: string,
  request: LiveResolveRequest,
): Promise<LiveResolveResult> {
  const values: Record<string, JsonRecord> = {};
  const failed: LiveResolveResult["failed"] = {};
  const baseQuery = request.parameters ?? {};

  await Promise.all(
    request.ids.map(async (id) => {
      try {
        const slots = await client.availability.list(connectionId, {
          ...baseQuery,
          productId: getString(baseQuery, "productId") ?? id,
        } as ConnectAvailabilityQuery);
        values[id] = {
          available: slots.some((slot) => getBoolean(slot, "available")),
          availability: slots,
          refreshed_at: new Date().toISOString(),
        };
      } catch {
        failed[id] = "error";
      }
    }),
  );

  return Object.keys(failed).length > 0 ? { values, failed } : { values };
}

async function liveResolveStays(
  client: VoyantConnectClient,
  connectionId: string,
  request: LiveResolveRequest,
): Promise<LiveResolveResult> {
  const response = await client.stays.search(
    connectionId,
    request.parameters as unknown as StaySearchQuery,
  );
  const values: Record<string, JsonRecord> = {};
  for (const offer of response.offers) {
    if (
      request.ids.includes(offer.accommodationId) ||
      request.ids.includes(offer.id)
    ) {
      const value = {
        available: true,
        offer,
        price: offer.totals.total,
        expires_at: offer.expiresAt,
      };
      values[offer.accommodationId] = value;
      values[offer.id] = value;
    }
  }
  return withMissingFailures(request.ids, values);
}

async function liveResolveCruises(
  client: VoyantConnectClient,
  connectionId: string,
  request: LiveResolveRequest,
): Promise<LiveResolveResult> {
  const response = await client.cruises.search(
    connectionId,
    request.parameters as unknown as CruiseSearchQuery,
  );
  const values: Record<string, JsonRecord> = {};
  for (const offer of response.offers) {
    if (
      request.ids.includes(offer.cruiseId) ||
      request.ids.includes(offer.sailingId) ||
      request.ids.includes(offer.id)
    ) {
      const value = {
        available: true,
        offer,
        price: offer.pricing.totalPrice,
        expires_at: offer.expiresAt,
      };
      values[offer.cruiseId] = value;
      values[offer.sailingId] = value;
      values[offer.id] = value;
    }
  }
  return withMissingFailures(request.ids, values);
}

function withMissingFailures(
  ids: string[],
  values: Record<string, JsonRecord>,
): LiveResolveResult {
  const failed: LiveResolveResult["failed"] = {};
  for (const id of ids) {
    if (!values[id]) failed[id] = "not_found";
  }
  return Object.keys(failed).length > 0 ? { values, failed } : { values };
}

async function getContentFromConnect(
  client: VoyantConnectClient,
  ctx: SourceAdapterContext,
  request: GetContentRequest,
): Promise<GetContentResult> {
  const module = request.entity_module;
  let content: unknown;
  if (module.includes("cruise")) {
    const row = await client.cruises.getOnConnection(
      ctx.connection_id,
      request.entity_id,
      {
        locale: request.locale,
      },
    );
    content = row;
  } else if (module.includes("accommodation") || module.includes("stay")) {
    const row = await client.accommodations.getOnConnection(
      ctx.connection_id,
      request.entity_id,
      {
        locale: request.locale,
      },
    );
    content = row;
  } else {
    const row = await client.products.getOnConnection(
      ctx.connection_id,
      request.entity_id,
    );
    content = row;
  }
  return {
    entity_module: request.entity_module,
    entity_id: request.entity_id,
    source_ref: request.entity_id,
    returned_locale: request.locale,
    content,
    content_schema_version: `${request.entity_module}/connect-v1`,
    source_updated_at: new Date(),
  };
}

async function reserveThroughConnect(
  client: VoyantConnectClient,
  ctx: SourceAdapterContext,
  request: ReserveRequest,
): Promise<ReserveResult> {
  if (request.parameters.connectRoute === "stays") {
    const booking = await client.stays.confirm(
      ctx.connection_id,
      request.parameters as unknown as StayConfirmInput,
      { idempotencyKey: request.idempotency_key },
    );
    return {
      upstream_ref: `stay:${booking.id}`,
      status: booking.status === "confirmed" ? "confirmed" : "held",
      upstream_payload: booking as unknown as JsonRecord,
    };
  }

  if (request.parameters.connectRoute === "cruises") {
    const quoteId =
      getString(request.parameters, "quoteId") ??
      (
        await client.cruiseBookings.lockSelection(
          ctx.connection_id,
          request.parameters as unknown as CruiseLockSelectionInput,
        )
      ).id;
    const booking = await client.cruiseBookings.confirm(
      ctx.connection_id,
      {
        ...request.parameters,
        quoteId,
      } as unknown as CruiseConfirmInput,
      { idempotencyKey: request.idempotency_key },
    );
    return {
      upstream_ref: `cruise:${booking.id}`,
      status: booking.status === "confirmed" ? "confirmed" : "held",
      upstream_payload: booking as unknown as JsonRecord,
    };
  }

  const booking = await client.bookings.create(
    ctx.connection_id,
    {
      ...request.parameters,
      productId:
        getString(request.parameters, "productId") ?? request.entity_id,
      contact: request.party?.contact ?? request.parameters.contact,
    } as unknown as CreateBookingInput,
    { idempotencyKey: request.idempotency_key },
  );
  const bookingId =
    getString(booking, "id") ??
    getString(booking, "externalBookingId") ??
    request.entity_id;
  const shouldConfirm =
    request.payment_intent !== undefined || request.parameters.confirm === true;
  const confirmed = shouldConfirm
    ? await client.bookings.confirm(ctx.connection_id, bookingId)
    : booking;
  return {
    upstream_ref: `booking:${bookingId}`,
    status: connectBookingStatusToReserveStatus(getString(confirmed, "status")),
    upstream_payload: confirmed,
  };
}

async function cancelThroughConnect(
  client: VoyantConnectClient,
  ctx: SourceAdapterContext,
  request: CancelRequest,
): Promise<CancelResult> {
  const ref = parseUpstreamRef(request.upstream_ref);
  const reason = request.reason ? { reason: request.reason } : undefined;
  if (ref.kind === "stay") {
    const booking = await client.stays.cancel(
      ctx.connection_id,
      ref.id,
      reason,
    );
    return { status: booking.status === "cancelled" ? "cancelled" : "pending" };
  }
  if (ref.kind === "cruise") {
    const booking = await client.cruiseBookings.cancel(
      ctx.connection_id,
      ref.id,
      reason,
    );
    return { status: booking.status === "cancelled" ? "cancelled" : "pending" };
  }
  const booking = await client.bookings.cancel(
    ctx.connection_id,
    ref.id,
    reason,
  );
  return {
    status:
      getString(booking, "status") === "cancelled" ? "cancelled" : "pending",
  };
}

async function getBookingByRef(
  client: VoyantConnectClient,
  connectionId: string,
  ref: { kind: string; id: string },
): Promise<JsonRecord | null> {
  if (ref.kind === "stay")
    return client.stays.get(connectionId, ref.id) as unknown as JsonRecord;
  if (ref.kind === "cruise")
    return client.cruiseBookings.get(
      connectionId,
      ref.id,
    ) as unknown as JsonRecord;
  return client.bookings.get(connectionId, ref.id);
}

function parseUpstreamRef(upstreamRef: string): { kind: string; id: string } {
  const index = upstreamRef.indexOf(":");
  if (index === -1) return { kind: "booking", id: upstreamRef };
  return {
    kind: upstreamRef.slice(0, index),
    id: upstreamRef.slice(index + 1),
  };
}

function categoryToEntityModule(category: string | undefined): string {
  if (category === "hotel") return "accommodations";
  if (category === "cruise") return "cruises";
  if (category === "airline") return "flights";
  if (
    category === "transfer" ||
    category === "transport" ||
    category === "experience"
  )
    return "products";
  return category ? `${category}s` : "products";
}

function getSourceRef(payload: JsonRecord, fallback: string): string {
  const sourceRef =
    getString(payload, "sourceRef") ?? getString(payload, "externalId");
  const optionId = getString(payload, "optionId");
  if (sourceRef) return sourceRef;
  if (optionId)
    return `${getString(payload, "productId") ?? fallback}:${optionId}`;
  return getString(payload, "productId") ?? fallback;
}

function isCatalogProjection(value: unknown): value is CatalogProjection {
  if (!value || typeof value !== "object") return false;
  const record = value as JsonRecord;
  return (
    typeof record.entity_module === "string" &&
    typeof record.entity_id === "string" &&
    !!record.provenance &&
    typeof record.provenance === "object" &&
    !!record.fields &&
    typeof record.fields === "object"
  );
}

function getRecord(record: JsonRecord, key: string): JsonRecord {
  const value = record[key];
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function getString(record: JsonRecord, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function getBoolean(record: JsonRecord, key: string): boolean {
  return record[key] === true;
}

function getStringArray(record: JsonRecord, key: string): string[] | undefined {
  const value = record[key];
  if (!Array.isArray(value)) return undefined;
  const strings = value.filter(
    (item): item is string => typeof item === "string",
  );
  return strings.length > 0 ? strings : undefined;
}

function dateFromString(value: string | undefined): Date | undefined {
  return value ? new Date(value) : undefined;
}

function connectBookingStatusToReserveStatus(
  value: string | undefined,
): ReserveResult["status"] {
  if (value === "confirmed" || value === "completed") return "confirmed";
  if (value === "failed") return "failed";
  return "held";
}

function reservationStatusFromConnect(
  value: string | undefined,
): ReservationStatus {
  if (
    value === "held" ||
    value === "confirmed" ||
    value === "ticketed" ||
    value === "failed" ||
    value === "cancelled" ||
    value === "pending" ||
    value === "refused" ||
    value === "cancelling"
  ) {
    return value;
  }
  if (value === "reserved") return "held";
  return "pending";
}

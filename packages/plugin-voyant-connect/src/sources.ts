import type { SourceAdapter } from "@voyant-travel/catalog";
import type { SourceAdapterRegistry } from "@voyant-travel/catalog/booking-engine";
import { createVoyantConnectSourceAdapter } from "@voyant-travel/connect-adapter";
import {
  createVoyantConnectClient,
  type VoyantConnectClient,
  type VoyantConnectClientOptions,
} from "@voyant-travel/connect-sdk";
import type { MemoizeOptions } from "@voyant-travel/cruises";
import type { CruiseSourceAdapterShimOptions } from "@voyant-travel/cruises/adapters";

import {
  createConnectCruiseSourceAdapter,
  skipCruiseConnectDocuments,
} from "./cruise-source.js";
import {
  createDestinationNameResolver,
  createGeoNameResolver,
  type DestinationNameResolver,
  type GeoNameResolver,
} from "./geo-resolver.js";
import { createConnectProductPackageSourceAdapter } from "./package-products.js";
import { positiveInteger, recordValue, stringValue } from "./utils.js";

export interface VoyantConnectSourceConnection {
  id: string;
  status?: string | null;
  providerKey?: string | null;
  supplierName?: string | null;
}

export interface VoyantConnectSourceRegistration {
  connectionId?: string;
  adapter: SourceAdapter;
  role: "generic" | "cruises" | "tui-products";
  sourceProvider?: string;
}

export interface VoyantConnectSourcesOptions {
  client?: VoyantConnectClient;
  connect?: VoyantConnectClientOptions;
  apiKey?: string;
  operatorId: string;
  baseUrl?: string;
  market?: string;
  syncLimit?: number | string;
  connections?: ReadonlyArray<VoyantConnectSourceConnection>;
  includePackageProductSources?: boolean;
  geo?: GeoNameResolver | false;
  destinationNames?: DestinationNameResolver | false;
  dataApiKey?: string;
  dataBaseUrl?: string;
  dataLang?: string;
  cruise?: {
    memoize?: MemoizeOptions;
    shim?: CruiseSourceAdapterShimOptions;
  };
  warn?: (message: string) => void;
}

export function createVoyantConnectSources(
  options: VoyantConnectSourcesOptions,
): VoyantConnectSourceRegistration[] {
  const client = resolveClient(options);
  const discoverLimit = positiveInteger(options.syncLimit) ?? 500;
  const connections = options.connections?.filter(
    (connection) => connection.status == null || connection.status === "active",
  );

  if (connections) {
    return connections.flatMap((connection) =>
      createConnectionScopedSources(
        { ...options, client, discoverLimit },
        connection,
      ),
    );
  }

  return createDefaultSources({ ...options, client, discoverLimit });
}

export function registerVoyantConnectSources(
  registry: SourceAdapterRegistry,
  sources: ReadonlyArray<VoyantConnectSourceRegistration>,
): void {
  for (const source of sources) {
    if (source.connectionId) {
      registry.register(source.connectionId, source.adapter);
    } else {
      registry.register(source.adapter);
    }
  }
}

export async function listVoyantConnectSourceConnections(options: {
  client: VoyantConnectClient;
  operatorId: string;
  warn?: (message: string) => void;
}): Promise<VoyantConnectSourceConnection[]> {
  const connections = (
    await options.client.connections.list(options.operatorId)
  ).filter((connection) => connection.status === "active");
  return Promise.all(
    connections.map(async (connection) => {
      const detail = await options.client.connections
        .get(options.operatorId, connection.id)
        .catch((err) => {
          options.warn?.(
            `could not fetch connection ${connection.id}; falling back to summary: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
          return connection;
        });
      return {
        id: detail.id,
        status: detail.status,
        providerKey: stringValue(recordValue(detail)?.providerKey) ?? null,
        supplierName: stringValue(recordValue(detail)?.supplierName) ?? null,
      };
    }),
  );
}

function createDefaultSources(
  options: VoyantConnectSourcesOptions & {
    client: VoyantConnectClient;
    discoverLimit: number;
  },
): VoyantConnectSourceRegistration[] {
  return [
    {
      role: "generic",
      adapter: createVoyantConnectSourceAdapter({
        client: options.client,
        operatorId: options.operatorId,
        market: options.market,
        discoverLimit: options.discoverLimit,
        mapDocument: skipCruiseConnectDocuments,
      }),
    },
    {
      role: "cruises",
      adapter: createConnectCruiseSourceAdapter(
        {
          client: options.client,
          operatorId: options.operatorId,
        },
        options.cruise?.shim,
        {
          memoize: options.cruise?.memoize,
          geo: resolveGeo(options),
        },
      ),
    },
  ];
}

function createConnectionScopedSources(
  options: VoyantConnectSourcesOptions & {
    client: VoyantConnectClient;
    discoverLimit: number;
  },
  connection: VoyantConnectSourceConnection,
): VoyantConnectSourceRegistration[] {
  const sourceProvider = inferConnectSourceProvider(connection);
  const sources: VoyantConnectSourceRegistration[] = [
    {
      connectionId: connection.id,
      role: "generic",
      sourceProvider,
      adapter: createVoyantConnectSourceAdapter({
        client: options.client,
        operatorId: options.operatorId,
        sourceProvider,
        connectionIds: [connection.id],
        market: options.market,
        discoverLimit: options.discoverLimit,
        mapDocument: skipCruiseConnectDocuments,
      }),
    },
    {
      connectionId: `${connection.id}:cruises`,
      role: "cruises",
      sourceProvider,
      adapter: createConnectCruiseSourceAdapter(
        {
          client: options.client,
          operatorId: options.operatorId,
          connectionIds: [connection.id],
          sourceProvider,
        },
        options.cruise?.shim,
        {
          memoize: options.cruise?.memoize,
          geo: resolveGeo(options),
          defaultSupplyModel: "scheduled",
        },
      ),
    },
  ];

  if (
    sourceProvider === "tui" &&
    options.includePackageProductSources !== false
  ) {
    const destinationNames = resolveDestinationNames(options);
    sources.push({
      connectionId: `${connection.id}:products`,
      role: "tui-products",
      sourceProvider,
      adapter: createConnectProductPackageSourceAdapter({
        client: options.client,
        operatorId: options.operatorId,
        connectionId: connection.id,
        sourceProvider,
        resolveDestination: destinationNames?.resolve,
        warn: options.warn,
      }),
    });
  }

  return sources;
}

function resolveClient(
  options: VoyantConnectSourcesOptions,
): VoyantConnectClient {
  if (options.client) return options.client;
  if (options.connect) return createVoyantConnectClient(options.connect);
  if (!options.apiKey) {
    throw new Error(
      "apiKey is required when client or connect is not provided",
    );
  }
  return createVoyantConnectClient({
    apiKey: options.apiKey,
    operatorId: options.operatorId,
    baseUrl: options.baseUrl,
  });
}

function resolveGeo(
  options: VoyantConnectSourcesOptions,
): GeoNameResolver | undefined {
  if (options.geo === false) return undefined;
  if (options.geo) return options.geo;
  const apiKey = options.dataApiKey ?? options.apiKey;
  if (!apiKey) return undefined;
  return createGeoNameResolver({
    apiKey,
    baseUrl: options.dataBaseUrl,
    lang: options.dataLang,
  });
}

function resolveDestinationNames(
  options: VoyantConnectSourcesOptions,
): DestinationNameResolver | undefined {
  if (options.destinationNames === false) return undefined;
  if (options.destinationNames) return options.destinationNames;
  const apiKey = options.dataApiKey ?? options.apiKey;
  if (!apiKey) return undefined;
  return createDestinationNameResolver({
    apiKey,
    baseUrl: options.dataBaseUrl,
    lang: options.dataLang,
  });
}

function inferConnectSourceProvider(connection: unknown): string | undefined {
  const record = recordValue(connection);
  if (!record) return undefined;
  const providerKey = stringValue(record.providerKey);
  if (providerKey) return providerKey;
  const supplierName = stringValue(record.supplierName)?.toLowerCase();
  if (!supplierName) return undefined;
  if (supplierName.includes("tui")) return "tui";
  if (supplierName.includes("viking")) return "viking";
  if (supplierName.includes("uniworld")) return "uniworld";
  return undefined;
}

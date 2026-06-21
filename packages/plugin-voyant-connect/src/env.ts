/**
 * Env-driven Voyant Connect source composition.
 *
 * Both the live booking-engine registry and the discovery-sync CLI resolve the
 * same `VOYANT_CONNECT_*` variables into source adapters. Keeping that mapping
 * here — the API-key fallback order, the operator id, market, discover limit,
 * and the incomplete-config warning — is the single source of truth so the two
 * paths can't drift on how Connect is configured (issue #1976).
 */

import { createVoyantConnectClient } from "@voyant-travel/connect-sdk";

import {
  createVoyantConnectSources,
  listVoyantConnectSourceConnections,
  type VoyantConnectSourceConnection,
  type VoyantConnectSourceRegistration,
  type VoyantConnectSourcesOptions,
} from "./sources.js";

/** The `VOYANT_*` variables this plugin reads. */
export interface VoyantConnectEnv {
  /** Primary Voyant API key. */
  VOYANT_API_KEY?: string;
  /** Legacy alias for `VOYANT_API_KEY`. */
  VOYANT_CONNECT_API_KEY?: string;
  /** Legacy alias for `VOYANT_API_KEY`. */
  VOYANT_CLOUD_API_KEY?: string;
  /** Operator whose Connect connections are sourced. */
  VOYANT_CONNECT_OPERATOR_ID?: string;
  /** Override the Connect API base URL. */
  VOYANT_CONNECT_API_URL?: string;
  /** Market filter passed to the generic adapter. */
  VOYANT_CONNECT_MARKET?: string;
  /** Per-adapter discover limit (parsed as a positive integer). */
  VOYANT_CONNECT_SYNC_LIMIT?: string;
  /** Voyant Cloud base URL used for geo/destination-name resolution. */
  VOYANT_CLOUD_API_URL?: string;
}

/** A fully-resolved Connect config — `apiKey` and `operatorId` are guaranteed. */
export type ResolvedVoyantConnectConfig = VoyantConnectSourcesOptions & {
  apiKey: string;
  operatorId: string;
};

export interface ResolveVoyantConnectEnvOptions {
  /** Called with a human-readable message when config is present but incomplete. */
  warn?: (message: string) => void;
}

/**
 * Map `VOYANT_CONNECT_*` env into `createVoyantConnectSources` options.
 *
 * Returns `null` when Connect is not configured at all (silent — Connect is
 * optional), or when it is partially configured (logged via `warn`, since a
 * half-set config is almost certainly a mistake).
 */
export function resolveVoyantConnectEnv(
  env: VoyantConnectEnv,
  options: ResolveVoyantConnectEnvOptions = {},
): ResolvedVoyantConnectConfig | null {
  const apiKey =
    env.VOYANT_API_KEY ??
    env.VOYANT_CONNECT_API_KEY ??
    env.VOYANT_CLOUD_API_KEY;
  const operatorId = env.VOYANT_CONNECT_OPERATOR_ID;

  if (!apiKey && !operatorId) return null;

  if (!apiKey || !operatorId) {
    options.warn?.(
      "incomplete Voyant Connect config; set VOYANT_API_KEY and " +
        "VOYANT_CONNECT_OPERATOR_ID to enable it.",
    );
    return null;
  }

  return {
    apiKey,
    operatorId,
    baseUrl: env.VOYANT_CONNECT_API_URL,
    market: env.VOYANT_CONNECT_MARKET,
    syncLimit: env.VOYANT_CONNECT_SYNC_LIMIT,
    dataBaseUrl: env.VOYANT_CLOUD_API_URL?.replace(/\/$/, ""),
  };
}

/**
 * Read-through cache for the serializable connection list, so a cold isolate can
 * skip the network enumeration. `get` returns `undefined` on a miss; `set` is
 * called with the freshly-enumerated list on a miss. The consumer owns the cache
 * key (enumeration is per-operator) and TTL — e.g. back it with Workers KV.
 */
export interface VoyantConnectConnectionCache {
  get: () => Promise<VoyantConnectSourceConnection[] | undefined>;
  set: (connections: VoyantConnectSourceConnection[]) => Promise<void>;
}

export interface PrepareVoyantConnectSourcesOptions extends ResolveVoyantConnectEnvOptions {
  /**
   * Enumerate the operator's active Connect connections and return one set of
   * connection-scoped adapters per connection (keyed by `connection.id`). When
   * `false` (the default), returns the single un-scoped default adapter pair.
   *
   * Discovery sync should pass `true` so sourced rows are keyed by the same
   * connection ids the booking engine routes by; see issue #1976.
   */
  enumerate?: boolean;
  /**
   * Pre-fetched connection list. When provided on the `enumerate` path, the
   * network enumeration is skipped entirely and these connections are used as-is
   * — letting a consumer cache the serializable list without reimplementing
   * env/connection resolution. Ignored when `enumerate` is falsy.
   */
  connections?: ReadonlyArray<VoyantConnectSourceConnection>;
  /**
   * Read-through cache for the enumeration. Consulted on the `enumerate` path
   * only when `connections` is not supplied: a cache hit skips the network call,
   * a miss enumerates and populates the cache. Ignored when `enumerate` is falsy.
   */
  connectionCache?: VoyantConnectConnectionCache;
  /**
   * Cruise adapter options threaded into both the default and per-connection
   * sources. Supply `cruise.memoize` to wrap cruise reads consistently across
   * the fallback and per-connection warm planes; see issue #94.
   */
  cruise?: VoyantConnectSourcesOptions["cruise"];
}

/**
 * Resolve Connect source registrations from env in one call. Collapses the
 * env-resolution + client construction + connection enumeration that both the
 * booking-engine registry and the sync CLI would otherwise hand-roll.
 *
 * Returns `[]` when Connect is not (fully) configured.
 */
export async function prepareVoyantConnectSources(
  env: VoyantConnectEnv,
  options: PrepareVoyantConnectSourcesOptions = {},
): Promise<VoyantConnectSourceRegistration[]> {
  const config = resolveVoyantConnectEnv(env, { warn: options.warn });
  if (!config) return [];

  if (!options.enumerate) {
    return createVoyantConnectSources({ ...config, cruise: options.cruise });
  }

  const client = createVoyantConnectClient({
    apiKey: config.apiKey,
    operatorId: config.operatorId,
    baseUrl: config.baseUrl,
  });
  const connections = await resolveConnections(client, config.operatorId, options);
  if (connections.length === 0) {
    options.warn?.(
      `Voyant Connect has no active connections for operator ${config.operatorId}`,
    );
  }
  return createVoyantConnectSources({
    ...config,
    client,
    connections,
    cruise: options.cruise,
  });
}

/**
 * Resolve the connection list for the enumerate path: prefer a pre-fetched
 * list, then a cache hit, otherwise enumerate over the network and populate the
 * cache on a miss.
 */
async function resolveConnections(
  client: ReturnType<typeof createVoyantConnectClient>,
  operatorId: string,
  options: PrepareVoyantConnectSourcesOptions,
): Promise<VoyantConnectSourceConnection[]> {
  if (options.connections) return [...options.connections];

  const cached = await options.connectionCache?.get();
  if (cached) return cached;

  const connections = await listVoyantConnectSourceConnections({
    client,
    operatorId,
    warn: options.warn,
  });
  await options.connectionCache?.set(connections);
  return connections;
}

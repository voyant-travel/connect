/**
 * Canonical-geography name resolvers backed by Voyant Data. Source sync uses
 * these to turn canonical ids and IATA tokens into readable catalog facets.
 */

import { createVoyantDataClient } from "@voyant-travel/data-sdk";

export interface GeoNameResolver {
  /** Resolve ids to display names, preserving order, dropping misses, deduped. */
  resolveMany(ids: ReadonlyArray<string>): Promise<string[]>;
}

export interface GeoNameResolverOptions {
  apiKey: string;
  /** Voyant Cloud base URL; defaults to the SDK's `https://api.voyant.travel`. */
  baseUrl?: string;
  /** BCP 47 language for resolved names. Defaults to `en`. */
  lang?: string;
}

export function createGeoNameResolver(
  options: GeoNameResolverOptions,
): GeoNameResolver {
  const client = createVoyantDataClient({
    apiKey: options.apiKey,
    ...(options.baseUrl ? { baseUrl: options.baseUrl } : {}),
    lang: options.lang ?? "en",
  });
  const cache = new Map<string, Promise<string | null>>();

  const resolveOne = (id: string): Promise<string | null> => {
    const cached = cache.get(id);
    if (cached) return cached;
    const pending = client.geo.places
      .get(id)
      .then((res: { data?: { name?: string | null } }) =>
        typeof res?.data?.name === "string" ? res.data.name : null,
      )
      .catch(() => null);
    cache.set(id, pending);
    return pending;
  };

  return {
    async resolveMany(ids) {
      const names = await Promise.all(ids.map(resolveOne));
      const seen = new Set<string>();
      const out: string[] = [];
      for (const name of names) {
        if (name && !seen.has(name)) {
          seen.add(name);
          out.push(name);
        }
      }
      return out;
    },
  };
}

export interface DestinationNameResolver {
  resolve(token: string): Promise<string>;
}

type AirportLookup = (iata: string) => Promise<unknown>;

type AirportLookupClient = {
  static?: {
    airports?: {
      get?: AirportLookup;
    };
  };
  air?: {
    airports?: {
      get?: AirportLookup;
    };
  };
};

function resolveAirportLookup(client: unknown): AirportLookup | null {
  const candidate = client as AirportLookupClient;
  const staticAirports = candidate.static?.airports;
  if (typeof staticAirports?.get === "function") {
    return (iata) => staticAirports.get?.(iata) ?? Promise.resolve(null);
  }
  const airAirports = candidate.air?.airports;
  if (typeof airAirports?.get === "function") {
    return (iata) => airAirports.get?.(iata) ?? Promise.resolve(null);
  }
  return null;
}

export function createDestinationNameResolver(
  options: GeoNameResolverOptions,
): DestinationNameResolver {
  const client = createVoyantDataClient({
    apiKey: options.apiKey,
    ...(options.baseUrl ? { baseUrl: options.baseUrl } : {}),
    lang: options.lang ?? "en",
  });
  const cache = new Map<string, Promise<string>>();
  const isIataCode = (value: string) => /^[A-Z]{3}$/.test(value);

  const resolve = (token: string): Promise<string> => {
    const cached = cache.get(token);
    if (cached) return cached;
    if (!isIataCode(token)) {
      const passthrough = Promise.resolve(token);
      cache.set(token, passthrough);
      return passthrough;
    }
    const airportLookup = resolveAirportLookup(client);
    if (!airportLookup) {
      const passthrough = Promise.resolve(token);
      cache.set(token, passthrough);
      return passthrough;
    }
    const pending = airportLookup(token)
      .then((res: unknown) => {
        const airport = (res as { data?: unknown })?.data ?? res;
        const city = (airport as { city?: unknown })?.city;
        const name = (airport as { name?: unknown })?.name;
        if (typeof city === "string" && city.length > 0) return city;
        if (typeof name === "string" && name.length > 0) return name;
        return token;
      })
      .catch(() => token);
    cache.set(token, pending);
    return pending;
  };

  return { resolve };
}

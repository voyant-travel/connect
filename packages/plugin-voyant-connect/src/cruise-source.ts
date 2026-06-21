/**
 * Structured Voyant Connect cruise sourcing.
 *
 * The generic adapter discovers cruises through flattened search documents.
 * Sourced cruises need the structured cruise adapter so canonical geography
 * survives into the catalog projection and storefront/admin facets.
 */

import type { ProjectionDefaults } from "@voyant-travel/connect-adapter";
import {
  type CatalogProjection,
  mapSearchDocumentToProjection,
} from "@voyant-travel/connect-adapter";
import {
  type ConnectCruiseAdapterOptions,
  createConnectCruiseAdapter,
} from "@voyant-travel/connect-cruises";
import type { SearchDocument } from "@voyant-travel/connect-sdk";
import {
  type MemoizeOptions,
  memoizeCruiseAdapter,
} from "@voyant-travel/cruises";
import {
  type CruiseAdapter,
  type CruiseSearchProjectionEntry,
  type CruiseSourceAdapterShim,
  type CruiseSourceAdapterShimOptions,
  cruiseAdapterToSourceAdapter,
} from "@voyant-travel/cruises/adapters";

import type { GeoNameResolver } from "./geo-resolver.js";
import { stringValue } from "./utils.js";

export interface ConnectCruiseSourceAdapterExtras {
  memoize?: MemoizeOptions;
  geo?: GeoNameResolver;
  defaultSupplyModel?: string;
}

/**
 * Generic Voyant Connect mapDocument hook that drops cruise documents so they
 * are sourced exclusively through the structured cruise adapter.
 */
export function skipCruiseConnectDocuments(
  document: SearchDocument,
  defaults: ProjectionDefaults,
): CatalogProjection | null {
  const projection = mapSearchDocumentToProjection(document, defaults);
  if (projection?.entity_module === "cruises") return null;
  return projection;
}

export function createConnectCruiseSourceAdapter(
  options: ConnectCruiseAdapterOptions,
  shimOptions?: CruiseSourceAdapterShimOptions,
  extras: ConnectCruiseSourceAdapterExtras = {},
): CruiseSourceAdapterShim {
  // `connect-cruises` returns vertical-conformant shapes directly (its
  // `ConnectCruiseAdapter` is assignable to `CruiseAdapter`), so no bridging
  // seam or cast is needed here.
  let adapter = memoizeCruiseAdapter(
    createConnectCruiseAdapter(options),
    extras.memoize,
  );
  if (extras.geo) adapter = withResolvedGeoNames(adapter, extras.geo);
  adapter = withDepartureWindows(adapter);
  return withSupplyModel(
    cruiseAdapterToSourceAdapter(adapter, shimOptions),
    extras.defaultSupplyModel ?? "scheduled",
  ) as CruiseSourceAdapterShim;
}

function withDepartureWindows(adapter: CruiseAdapter): CruiseAdapter {
  return {
    ...adapter,
    searchProjection: (opts) =>
      resolveDepartureWindows(adapter, adapter.searchProjection(opts)),
  };
}

async function* resolveDepartureWindows(
  adapter: CruiseAdapter,
  source: AsyncIterable<CruiseSearchProjectionEntry>,
): AsyncIterable<CruiseSearchProjectionEntry> {
  for await (const entry of source) {
    if (entry.departureMonths == null || entry.earliestDeparture == null) {
      try {
        const sailings = await adapter.listSailingsForCruise(entry.sourceRef);
        const dates = sailings
          .map((sailing) => sailing.departureDate)
          .filter(
            (date): date is string =>
              typeof date === "string" && date.length >= 7,
          )
          .sort();
        if (dates.length > 0) {
          entry.earliestDeparture = entry.earliestDeparture ?? dates[0];
          entry.latestDeparture =
            entry.latestDeparture ?? dates[dates.length - 1];
          entry.departureMonths =
            entry.departureMonths ??
            [...new Set(dates.map((date) => date.slice(0, 7)))].sort();
          entry.departureCount = entry.departureCount ?? dates.length;
        }
      } catch {
        // Leave this cruise un-enriched; the rest of the sync can continue.
      }
    }
    yield entry;
  }
}

function withResolvedGeoNames(
  adapter: CruiseAdapter,
  geo: GeoNameResolver,
): CruiseAdapter {
  return {
    ...adapter,
    searchProjection: (opts) =>
      resolveGeoNamesOnEntries(adapter.searchProjection(opts), geo),
  };
}

async function* resolveGeoNamesOnEntries(
  source: AsyncIterable<CruiseSearchProjectionEntry>,
  geo: GeoNameResolver,
): AsyncIterable<CruiseSearchProjectionEntry> {
  for await (const entry of source) {
    if (!entry.ports?.length && entry.portIds?.length) {
      entry.ports = await geo.resolveMany(entry.portIds);
    }
    if (!entry.regions?.length && entry.regionIds?.length) {
      entry.regions = await geo.resolveMany(entry.regionIds);
    }
    if (!entry.waterways?.length && entry.waterwayIds?.length) {
      entry.waterways = await geo.resolveMany(entry.waterwayIds);
    }
    yield entry;
  }
}

export function withSupplyModel(
  adapter: CatalogSourceAdapter,
  defaultSupplyModel: string,
) {
  const discover = adapter.discover?.bind(adapter);
  if (!discover) return adapter;
  return {
    ...adapter,
    async discover(
      ...args: Parameters<NonNullable<CatalogSourceAdapter["discover"]>>
    ) {
      const page = await discover(...args);
      return {
        ...page,
        projections: page.projections.map((projection) => ({
          ...projection,
          fields: {
            ...projection.fields,
            supplyModel:
              stringValue(projection.fields.supplyModel) ?? defaultSupplyModel,
          },
        })),
      };
    },
  };
}

type CatalogSourceAdapter = import("@voyant-travel/catalog").SourceAdapter;

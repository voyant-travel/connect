import type { CatalogProjection, SourceAdapter } from "@voyant-travel/catalog";
import type { VoyantConnectClient } from "@voyant-travel/connect-sdk";

import type { DestinationNameResolver } from "./geo-resolver.js";
import {
  numberValue,
  recordValue,
  stringArrayValue,
  stringValue,
} from "./utils.js";

export interface ConnectProductPackageSourceAdapterOptions {
  client: VoyantConnectClient;
  operatorId: string;
  connectionId: string;
  sourceProvider: string;
  /** Resolve a destination token (IATA code or name) to a readable label. */
  resolveDestination?: DestinationNameResolver["resolve"];
  warn?: (message: string) => void;
}

export function createConnectProductPackageSourceAdapter(
  options: ConnectProductPackageSourceAdapterOptions,
): SourceAdapter {
  return {
    kind: "voyant-connect:tui-products",
    capabilities: {
      verticals: ["products"],
      supportsLiveResolution: false,
      supportsDriftDetection: false,
      supportsBookingForwarding: false,
      supportsReservationRetrieval: false,
      supportsSyncCancellation: false,
      postBookOperations: [],
      supportsContentFetch: false,
      ownsContentCache: false,
      ownsAvailabilityCache: false,
    },
    async discover(_ctx, cursor) {
      if (cursor) return { projections: [], next_cursor: undefined };
      const rows = await options.client.products.listOnConnection(
        options.connectionId,
      );

      const starsByAccommodation = new Map<string, number>();
      const countryCodes = new Set<string>();
      for (const row of rows) {
        const cc = stringValue(
          recordValue((row as Record<string, unknown>).package)?.countryCode,
        );
        if (cc) countryCodes.add(cc);
      }
      await Promise.all(
        [...countryCodes].map(async (countryCode) => {
          try {
            const accommodations = await options.client.accommodations.list({
              connectionId: options.connectionId,
              countryCode,
              limit: 500,
            });
            if (accommodations.length >= 500) {
              options.warn?.(
                `accommodations.list hit the 500 cap for ${countryCode}; some star ratings may be missing`,
              );
            }
            for (const accommodation of accommodations) {
              const ext = stringValue(
                (accommodation as Record<string, unknown>).externalId,
              );
              const stars = numberValue(
                (accommodation as Record<string, unknown>).stars,
              );
              if (ext && stars != null) starsByAccommodation.set(ext, stars);
            }
          } catch (err) {
            options.warn?.(
              `could not load stars for ${countryCode}: ${
                err instanceof Error ? err.message : String(err)
              }`,
            );
          }
        }),
      );

      const destinationLabels = new Map<string, string>();
      if (options.resolveDestination) {
        const tokens = new Set<string>();
        for (const row of rows) {
          for (const token of stringArrayValue(
            (row as Record<string, unknown>).destinations,
          )) {
            tokens.add(token);
          }
        }
        await Promise.all(
          [...tokens].map(async (token) => {
            destinationLabels.set(
              token,
              (await options.resolveDestination?.(token).catch(() => token)) ??
                token,
            );
          }),
        );
      }

      return {
        projections: rows
          .map((row) =>
            mapConnectPackageProductToProjection(
              row as Record<string, unknown>,
              options,
              {
                starsByAccommodation,
                destinationLabels,
              },
            ),
          )
          .filter(
            (projection): projection is CatalogProjection =>
              projection !== null,
          ),
        next_cursor: undefined,
      };
    },
  };
}

function mapConnectPackageProductToProjection(
  row: Record<string, unknown>,
  options: {
    operatorId: string;
    connectionId: string;
    sourceProvider: string;
  },
  enrich: {
    starsByAccommodation: Map<string, number>;
    destinationLabels: Map<string, string>;
  },
): CatalogProjection | null {
  const id = stringValue(row.id);
  if (!id) return null;

  const packagePayload = recordValue(row.package);
  const meta = recordValue(row.meta);
  const freshness = recordValue(meta?.freshness);
  const source = recordValue(meta?.source);
  const refreshedAt =
    stringValue(freshness?.refreshedAt) ?? stringValue(meta?.updatedAt);
  const title = stringValue(row.title) ?? id;
  const summary = stringValue(row.summary);
  const heroImageUrl = stringValue(packagePayload?.heroImageUrl);
  const totalPrice = recordValue(packagePayload?.totalPrice);
  const pricePerPerson = recordValue(packagePayload?.pricePerPerson);
  const sellPrice = totalPrice ?? pricePerPerson;
  const tags = stringArrayValue(row.tags);
  const board = stringValue(packagePayload?.board) ?? null;
  const countryCode = stringValue(packagePayload?.countryCode);
  const transport = packagePayload?.flightIncluded === true ? "flight" : null;
  const accommodationExternalId = stringValue(
    packagePayload?.accommodationExternalId,
  );
  const starsValue = accommodationExternalId
    ? (enrich.starsByAccommodation.get(accommodationExternalId) ?? null)
    : null;
  const stars = starsValue != null ? String(starsValue) : null;
  const destinations = stringArrayValue(row.destinations).map(
    (token) => enrich.destinationLabels.get(token) ?? token,
  );
  const supplyModel =
    stringValue(row.supplyModel) ??
    stringValue(packagePayload?.supplyModel) ??
    "dynamic";

  return {
    entity_module: "products",
    entity_id: id,
    provenance: {
      source_kind: "voyant-connect",
      source_provider: options.sourceProvider,
      source_connection_id: options.connectionId,
      source_ref: id,
      source_freshness: "sync",
      ...(refreshedAt ? { last_sourced_at: new Date(refreshedAt) } : {}),
    },
    fields: {
      id,
      "source.kind": "voyant-connect",
      "source.ref": id,
      "source.connection_id": options.connectionId,
      "seller.operator_id": options.operatorId,
      supplierId:
        stringValue(row.supplierId) ??
        stringValue(source?.providerKey) ??
        "tui",
      productId: id,
      status: "active",
      activated: true,
      bookingMode: stringValue(packagePayload?.bookingMode) ?? "stay",
      capacityMode: "on_request",
      visibility: "public",
      productTypeId: stringValue(row.productType) ?? "package",
      name: title,
      title,
      slug: stringValue(row.slug) ?? id,
      shortDescription: summary,
      description: summary,
      tags,
      primaryMediaUrl: heroImageUrl,
      thumbnailUrl: heroImageUrl,
      coverMediaUrl: heroImageUrl,
      sellAmountCents: numberValue(sellPrice?.amountMinor),
      sellCurrency:
        stringValue(sellPrice?.currency) ??
        stringValue(row.defaultCurrency) ??
        stringValue(packagePayload?.currency),
      priceFromAmountCents: numberValue(sellPrice?.amountMinor),
      priceFromCurrency:
        stringValue(sellPrice?.currency) ??
        stringValue(row.defaultCurrency) ??
        stringValue(packagePayload?.currency),
      hasPricing: numberValue(sellPrice?.amountMinor) != null,
      durationDays: numberValue(packagePayload?.nights),
      board,
      stars,
      transport,
      destinations,
      countryCodes: countryCode ? [countryCode] : [],
      supplyModel,
      updatedAt: refreshedAt ?? new Date().toISOString(),
      connect_document: row,
    },
  };
}

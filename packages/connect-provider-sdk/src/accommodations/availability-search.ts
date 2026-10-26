import { z } from "zod";

import {
  boardCodeEnum,
  connectDateSchema,
  connectDateTimeSchema,
  connectMoneySchema,
} from "./primitives.js";
import {
  accommodationCategoryEnum,
  bookingRequirementsSchema,
  cancellationPolicySchema,
} from "./shared.js";

export const occupancyAdjustmentSchema = z.object({
  occupancy: z.object({
    adults: z.number().int().min(1),
    children: z.number().int().nonnegative().optional(),
    infants: z.number().int().nonnegative().optional(),
  }),
  amount: connectMoneySchema,
});

export const childAgeAdjustmentSchema = z.object({
  minAge: z.number().int().nonnegative(),
  maxAge: z.number().int().nonnegative(),
  amount: connectMoneySchema,
});

export const taxLineItemSchema = z.object({
  code: z.string(),
  amount: connectMoneySchema,
  perNight: z.boolean(),
  perPerson: z.boolean(),
});

export type TaxLineItem = z.infer<typeof taxLineItemSchema>;

export const feeLineItemSchema = z.object({
  code: z.string(),
  amount: connectMoneySchema,
  perNight: z.boolean(),
  perPerson: z.boolean(),
});

export type FeeLineItem = z.infer<typeof feeLineItemSchema>;

export const roomAvailabilitySchema = z.object({
  connectionId: z.string(),
  ratePlanId: z.string(),
  roomTypeId: z.string(),
  accommodationId: z.string(),
  date: connectDateSchema,
  available: z.number().int().nonnegative(),
  stopSell: z.boolean(),
  closedToArrival: z.boolean(),
  closedToDeparture: z.boolean(),
  minStay: z.number().int().min(1).optional(),
  maxStay: z.number().int().min(1).optional(),
  baseAmount: connectMoneySchema,
  occupancyAdjustments: z.array(occupancyAdjustmentSchema).optional(),
  childAgeAdjustments: z.array(childAgeAdjustmentSchema).optional(),
  taxes: z.array(taxLineItemSchema).optional(),
  fees: z.array(feeLineItemSchema).optional(),
});

export type RoomAvailability = z.infer<typeof roomAvailabilitySchema>;

export const staySearchRoomSchema = z.object({
  adults: z.number().int().min(1),
  children: z.number().int().nonnegative().optional(),
  childrenAges: z.array(z.number().int().nonnegative()).optional(),
  infants: z.number().int().nonnegative().optional(),
});

export type StaySearchRoom = z.infer<typeof staySearchRoomSchema>;

export const staySearchQuerySchema = z
  .object({
    destination: z
      .object({
        countryCode: z.string().length(2).optional(),
        region: z.string().optional(),
        city: z.string().optional(),
      })
      .optional(),
    near: z
      .object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        radiusKm: z.number().positive(),
      })
      .optional(),
    accommodationIds: z.array(z.string()).optional(),
    /**
     * Provider-native destination codes the platform resolved from the synced
     * catalog (`connect_synced_accommodations.destination_codes`) for the
     * requested `accommodationIds`. Destination-scoped suppliers (e.g. TUI)
     * need a destination to drive an offer search; this lets the connector
     * consume an authoritative set instead of inferring it from hotel-code
     * prefixes. Platform-derived - any client-supplied value is overwritten.
     */
    resolvedDestinationCodes: z.array(z.string()).optional(),
    checkIn: connectDateSchema,
    checkOut: connectDateSchema,
    rooms: z.array(staySearchRoomSchema).min(1),
    category: z.array(accommodationCategoryEnum).optional(),
    minStars: z.number().min(0).max(5).optional(),
    amenities: z.array(z.string()).optional(),
    boards: z.array(boardCodeEnum).optional(),
    refundableOnly: z.boolean().optional(),
    maxPrice: connectMoneySchema.optional(),
    locale: z.string().min(2).optional(),
    limit: z.number().int().min(1).max(200).optional(),
    cursor: z.string().optional(),
  })
  .refine((q) => q.destination || q.near || q.accommodationIds, {
    message: "Search requires one of: destination, near, or accommodationIds",
  });

export type StaySearchQuery = z.infer<typeof staySearchQuerySchema>;

export const stayOfferRoomSchema = z.object({
  roomTypeId: z.string(),
  ratePlanId: z.string(),
  occupancy: staySearchRoomSchema,
  nights: z.number().int().min(1),
  nightlyBreakdown: z.array(
    z.object({ date: connectDateSchema, amount: connectMoneySchema }),
  ),
  subtotal: connectMoneySchema,
  taxes: connectMoneySchema,
  fees: connectMoneySchema,
  total: connectMoneySchema,
  cancellationPolicy: cancellationPolicySchema,
});

export type StayOfferRoom = z.infer<typeof stayOfferRoomSchema>;

export const stayOfferTotalsSchema = z.object({
  subtotal: connectMoneySchema,
  taxes: connectMoneySchema,
  fees: connectMoneySchema,
  total: connectMoneySchema,
});

export type StayOfferTotals = z.infer<typeof stayOfferTotalsSchema>;

export const stayOfferSchema = z.object({
  id: z.string(),
  connectionId: z.string(),
  accommodationId: z.string(),
  rooms: z.array(stayOfferRoomSchema).min(1),
  totals: stayOfferTotalsSchema,
  expiresAt: connectDateTimeSchema,
  /** The supplier's booking requirements for this offer, when it declares any. */
  bookingRequirements: bookingRequirementsSchema.optional(),
  /** Server-issued proof that authenticates this exact search result for hold. */
  __offerProof: z.string().optional(),
  /** Existing grant presentation metadata, authenticated by __offerProof. */
  __supplierFitOffer: z.unknown().optional(),
  __commercialSettlement: z.unknown().optional(),
});

export type StayOffer = z.infer<typeof stayOfferSchema>;

export const restrictionRowSchema = z.object({
  connectionId: z.string(),
  ratePlanId: z.string(),
  date: connectDateSchema,
  stopSell: z.boolean().optional(),
  closedToArrival: z.boolean().optional(),
  closedToDeparture: z.boolean().optional(),
  minStay: z.number().int().min(1).nullable().optional(),
  maxStay: z.number().int().min(1).nullable().optional(),
});

export type RestrictionRow = z.infer<typeof restrictionRowSchema>;

export const connectionDiagnosticSchema = z.object({
  connectionId: z.string(),
  status: z.enum(["ok", "timeout", "error", "unauthorized"]),
  message: z.string().optional(),
  durationMs: z.number().int().nonnegative().optional(),
});

export type ConnectionDiagnostic = z.infer<typeof connectionDiagnosticSchema>;

export const staySearchResponseSchema = z.object({
  offers: z.array(stayOfferSchema),
  connectionDiagnostics: z.array(connectionDiagnosticSchema).optional(),
  nextCursor: z.string().nullable().optional(),
});

export type StaySearchResponse = z.infer<typeof staySearchResponseSchema>;

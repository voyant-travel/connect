import { z } from "zod";

import { connectDateTimeSchema, connectMoneySchema } from "./primitives.js";

export const accommodationCategoryEnum = z.enum([
  "hotel",
  "apartment",
  "villa",
  "hostel",
  "guesthouse",
  "resort",
  "bnb",
  "other",
]);

export type AccommodationCategory = z.infer<typeof accommodationCategoryEnum>;

export const ratePlanGuaranteeModeEnum = z.enum([
  "none",
  "card_hold",
  "deposit",
  "prepay",
]);

export type RatePlanGuaranteeMode = z.infer<typeof ratePlanGuaranteeModeEnum>;

export const ratePlanPricingModeEnum = z.enum(["static", "dynamic"]);

export type RatePlanPricingMode = z.infer<typeof ratePlanPricingModeEnum>;

export const occupancyPricingModeEnum = z.enum([
  "per_room",
  "per_person",
  "per_room_with_per_extra_person",
]);

export type OccupancyPricingMode = z.infer<typeof occupancyPricingModeEnum>;

export const stayBookingStatusEnum = z.enum([
  "pending",
  "confirmed",
  "cancelled",
  "no_show",
  "completed",
]);

export type StayBookingStatus = z.infer<typeof stayBookingStatusEnum>;

export const stayHoldStatusEnum = z.enum([
  "active",
  "confirming",
  "confirmation_unknown",
  "expired",
  "consumed",
  "released",
]);

export type StayHoldStatus = z.infer<typeof stayHoldStatusEnum>;

export const guestTypeEnum = z.enum(["adult", "child", "infant"]);

export type GuestType = z.infer<typeof guestTypeEnum>;

export const bedTypeEnum = z.enum([
  "single",
  "double",
  "queen",
  "king",
  "twin",
  "sofa",
  "bunk",
]);

export type BedType = z.infer<typeof bedTypeEnum>;

export const cancellationPenaltySchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("percentage"),
    value: z.number().min(0).max(100),
  }),
  z.object({ type: z.literal("first_night") }),
  z.object({ type: z.literal("fixed"), amount: connectMoneySchema }),
  z.object({ type: z.literal("full") }),
]);

export type CancellationPenalty = z.infer<typeof cancellationPenaltySchema>;

export const cancellationDeadlineSchema = z.object({
  fromHoursBeforeCheckIn: z.number().int().nonnegative(),
  toHoursBeforeCheckIn: z.number().int().nonnegative(),
  penalty: cancellationPenaltySchema,
});

export type CancellationDeadline = z.infer<typeof cancellationDeadlineSchema>;

export const cancellationPolicySchema = z.object({
  freeCancellationUntil: connectDateTimeSchema.nullable().optional(),
  deadlines: z.array(cancellationDeadlineSchema),
});

export type CancellationPolicy = z.infer<typeof cancellationPolicySchema>;

export const accommodationLocationSchema = z.object({
  countryCode: z.string().length(2),
  region: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  address: z
    .object({
      line1: z.string(),
      line2: z.string().nullable().optional(),
      postalCode: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  destinationCodes: z.array(z.string()).optional(),
});

export type AccommodationLocation = z.infer<typeof accommodationLocationSchema>;

export const accommodationContactSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
});

export const accommodationPoliciesSchema = z.object({
  checkInFrom: z.string().optional(),
  checkInTo: z.string().optional(),
  checkOutFrom: z.string().optional(),
  checkOutTo: z.string().optional(),
  childrenWelcome: z.boolean().optional(),
  petsWelcome: z.boolean().optional(),
  smokingAllowed: z.boolean().optional(),
  extraBeds: z
    .object({
      max: z.number().int().nonnegative().optional(),
      ageRange: z
        .object({ min: z.number().int(), max: z.number().int() })
        .optional(),
    })
    .optional(),
});

export const accommodationImageSchema = z.object({
  url: z.string().url(),
  caption: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sortOrder: z.number().int().optional(),
});

export type AccommodationImage = z.infer<typeof accommodationImageSchema>;

export const accommodationRatingSchema = z.object({
  stars: z.number().min(0).max(5).optional(),
  source: z.string().optional(),
});

/**
 * One piece of booking data the supplier needs, and the form it must take.
 *
 * `key` names the value on the confirm input: `contact.email`,
 * `contact.phone`, `contact.address.line1`, `contact.address.city`,
 * `contact.address.postalCode`, `contact.address.country`,
 * `leadTraveler.sex`, `traveler.firstName`, `traveler.lastName`. Keys are
 * open: a caller that does not recognise one ignores it.
 *
 * `pattern` is a regular expression the whole value must match (JavaScript
 * syntax, applied with `patternFlags`); `message` is the supplier's own
 * explanation for the field.
 */
export const bookingRequirementFieldSchema = z.object({
  key: z.string().min(1).max(64),
  required: z.boolean(),
  pattern: z.string().min(1).max(512).optional(),
  patternFlags: z
    .string()
    .regex(/^[imsu]{0,4}$/)
    .optional(),
  message: z.string().max(300).optional(),
});

export type BookingRequirementField = z.infer<
  typeof bookingRequirementFieldSchema
>;

/**
 * What the supplier will refuse a confirm without. Declared on an offer so a
 * booking flow can collect and check it before the customer pays: a supplier
 * that refuses at confirm took no booking, but the payment may already exist.
 */
export const bookingRequirementsSchema = z.object({
  fields: z.array(bookingRequirementFieldSchema).max(50),
});

export type BookingRequirements = z.infer<typeof bookingRequirementsSchema>;

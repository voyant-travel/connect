import { z } from "zod";

import {
  connectDateSchema,
  connectDateTimeSchema,
  connectMoneySchema,
} from "./primitives.js";
import {
  stayOfferRoomSchema,
  stayOfferSchema,
  stayOfferTotalsSchema,
  staySearchRoomSchema,
} from "./availability-search.js";
import {
  cancellationPolicySchema,
  guestTypeEnum,
  stayBookingStatusEnum,
  stayHoldStatusEnum,
} from "./shared.js";

export const stayHoldSchema = z.object({
  id: z.string(),
  offerSnapshot: stayOfferSchema,
  status: stayHoldStatusEnum,
  expiresAt: connectDateTimeSchema,
});

export type StayHold = z.infer<typeof stayHoldSchema>;

export const passportSchema = z.object({
  number: z.string(),
  country: z.string().length(2),
  expiresAt: connectDateSchema,
});

export const guestSchema = z.object({
  type: guestTypeEnum,
  firstName: z.string(),
  lastName: z.string(),
  age: z.number().int().nonnegative().optional(),
  dateOfBirth: connectDateSchema.optional(),
  title: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  passport: passportSchema.optional(),
});

export type Guest = z.infer<typeof guestSchema>;

export const stayBookingContactSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
});

export type StayBookingContact = z.infer<typeof stayBookingContactSchema>;

export const stayBookingRoomSchema = z.object({
  roomTypeId: z.string(),
  ratePlanId: z.string(),
  checkIn: connectDateSchema,
  checkOut: connectDateSchema,
  occupancy: staySearchRoomSchema,
  guests: z.array(guestSchema).min(1),
  totals: stayOfferRoomSchema,
});

export type StayBookingRoom = z.infer<typeof stayBookingRoomSchema>;

export const paymentReferenceSchema = z.object({
  provider: z.string(),
  reference: z.string(),
  capturedAt: connectDateTimeSchema.optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export type PaymentReference = z.infer<typeof paymentReferenceSchema>;

export const stayBookingCancellationSchema = z.object({
  cancelledAt: connectDateTimeSchema,
  reason: z.string().optional(),
  refundAmount: connectMoneySchema.optional(),
});

export const stayBookingVoucherSchema = z.object({
  url: z.string().url().optional(),
  codes: z.array(z.string()).optional(),
});

export const stayBookingSchema = z.object({
  id: z.string(),
  connectionId: z.string(),
  accommodationId: z.string(),
  status: stayBookingStatusEnum,
  reference: z.string(),
  /** PMS identity for lookup and cancellation; Connect assigns its own booking id. */
  externalReference: z.string().optional(),
  voucher: stayBookingVoucherSchema.optional(),
  rooms: z.array(stayBookingRoomSchema).min(1),
  leadGuest: guestSchema,
  contact: stayBookingContactSchema,
  totals: stayOfferTotalsSchema,
  cancellationPolicy: cancellationPolicySchema,
  cancellation: stayBookingCancellationSchema.optional(),
  payment: paymentReferenceSchema.optional(),
  notes: z.string().optional(),
  createdAt: connectDateTimeSchema,
  updatedAt: connectDateTimeSchema,
});

export type StayBooking = z.infer<typeof stayBookingSchema>;

export const stayConfirmInputSchema = z.object({
  holdId: z.string(),
  leadGuest: guestSchema,
  contact: stayBookingContactSchema,
  guestsByRoom: z.array(z.array(guestSchema).min(1)).min(1),
  paymentReference: paymentReferenceSchema.optional(),
  notes: z.string().optional(),
});

export type StayConfirmInput = z.infer<typeof stayConfirmInputSchema>;

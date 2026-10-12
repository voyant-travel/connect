import { z } from "zod";

export const connectDirectionEnum = z.enum(["inbound", "outbound"]);

export type ConnectDirection = z.infer<typeof connectDirectionEnum>;

export const connectOperatingModeEnum = z.enum([
  "voyantBacked",
  "standalone",
  "hybrid",
]);

export type ConnectOperatingMode = z.infer<typeof connectOperatingModeEnum>;

export const connectSourceOfTruthModeEnum = z.enum([
  "voyant",
  "external",
  "connect",
  "mixed",
]);

export type ConnectSourceOfTruthMode = z.infer<
  typeof connectSourceOfTruthModeEnum
>;

export const connectReadModeEnum = z.enum([
  "live",
  "synchronized",
  "cached",
  "mixed",
]);

export type ConnectReadMode = z.infer<typeof connectReadModeEnum>;

export const connectRefreshStrategyEnum = z.enum([
  "webhook",
  "polling",
  "scheduled",
  "onDemand",
  "manual",
  "mixed",
]);

export type ConnectRefreshStrategy = z.infer<typeof connectRefreshStrategyEnum>;

export const connectEntityCategoryEnum = z.enum([
  "operator",
  "hotel",
  "hotelGroup",
  "dmc",
  "airline",
  "cruise",
  "insurance",
  "transport",
  "transfer",
  "guide",
  "experience",
  "tour",
  "other",
]);

export type ConnectEntityCategory = z.infer<typeof connectEntityCategoryEnum>;

export const connectEntityKindEnum = z.enum([
  "connection",
  "supplier",
  "product",
  "option",
  "unit",
  "availability",
  "booking",
  "syncRun",
  "distribution",
  "searchDocument",
  "webhookEvent",
]);

export type ConnectEntityKind = z.infer<typeof connectEntityKindEnum>;

export const connectParticipantTypeEnum = z.enum([
  "traveler",
  "occupant",
  "other",
]);

export type ConnectParticipantType = z.infer<typeof connectParticipantTypeEnum>;

export const connectTravelerCategoryEnum = z.enum([
  "adult",
  "child",
  "infant",
  "senior",
  "other",
]);

export type ConnectTravelerCategory = z.infer<
  typeof connectTravelerCategoryEnum
>;

export const connectBookingItemRoleEnum = z.enum([
  "traveler",
  "occupant",
  "beneficiary",
  "other",
]);

export type ConnectBookingItemRole = z.infer<typeof connectBookingItemRoleEnum>;

export const connectBookingItemTypeEnum = z.enum([
  "unit",
  "extra",
  "service",
  "fee",
  "tax",
  "discount",
  "adjustment",
  "accommodation",
  "transport",
  "other",
]);

export type ConnectBookingItemType = z.infer<typeof connectBookingItemTypeEnum>;

export const connectBookingItemStatusEnum = z.enum([
  "draft",
  "onHold",
  "confirmed",
  "cancelled",
  "expired",
  "fulfilled",
]);

export type ConnectBookingItemStatus = z.infer<
  typeof connectBookingItemStatusEnum
>;

export const connectBookingSourceTypeEnum = z.enum([
  "direct",
  "manual",
  "affiliate",
  "ota",
  "reseller",
  "apiPartner",
  "internal",
]);

export type ConnectBookingSourceType = z.infer<
  typeof connectBookingSourceTypeEnum
>;

export const connectMeetingModeEnum = z.enum([
  "meetingOnly",
  "pickupOnly",
  "meetOrPickup",
]);

export type ConnectMeetingMode = z.infer<typeof connectMeetingModeEnum>;

export const connectPickupTimingModeEnum = z.enum([
  "fixedTime",
  "offsetFromStart",
]);

export type ConnectPickupTimingMode = z.infer<
  typeof connectPickupTimingModeEnum
>;

export const connectAvailabilitySlotStatusEnum = z.enum([
  "open",
  "closed",
  "soldOut",
  "cancelled",
]);

export type ConnectAvailabilitySlotStatus = z.infer<
  typeof connectAvailabilitySlotStatusEnum
>;

export const connectBookingAllocationTypeEnum = z.enum([
  "unit",
  "pickup",
  "resource",
]);

export type ConnectBookingAllocationType = z.infer<
  typeof connectBookingAllocationTypeEnum
>;

export const connectBookingAllocationStatusEnum = z.enum([
  "held",
  "confirmed",
  "released",
  "expired",
  "cancelled",
  "fulfilled",
]);

export type ConnectBookingAllocationStatus = z.infer<
  typeof connectBookingAllocationStatusEnum
>;

export const connectFulfillmentTypeEnum = z.enum([
  "voucher",
  "ticket",
  "pdf",
  "qrCode",
  "barcode",
  "mobile",
  "other",
]);

export type ConnectFulfillmentType = z.infer<typeof connectFulfillmentTypeEnum>;

export const connectFulfillmentDeliveryChannelEnum = z.enum([
  "download",
  "email",
  "api",
  "wallet",
  "other",
]);

export type ConnectFulfillmentDeliveryChannel = z.infer<
  typeof connectFulfillmentDeliveryChannelEnum
>;

export const connectFulfillmentStatusEnum = z.enum([
  "pending",
  "issued",
  "reissued",
  "revoked",
  "failed",
]);

export type ConnectFulfillmentStatus = z.infer<
  typeof connectFulfillmentStatusEnum
>;

export const connectRedemptionMethodEnum = z.enum([
  "manual",
  "scan",
  "api",
  "other",
]);

export type ConnectRedemptionMethod = z.infer<
  typeof connectRedemptionMethodEnum
>;

export const connectBookingDocumentTypeEnum = z.enum([
  "visa",
  "insurance",
  "health",
  "passportCopy",
  "other",
]);

export type ConnectBookingDocumentType = z.infer<
  typeof connectBookingDocumentTypeEnum
>;

export const connectSupplierConfirmationStatusEnum = z.enum([
  "pending",
  "confirmed",
  "rejected",
  "cancelled",
]);

export type ConnectSupplierConfirmationStatus = z.infer<
  typeof connectSupplierConfirmationStatusEnum
>;

export const connectBookingActivityTypeEnum = z.enum([
  "bookingCreated",
  "bookingReserved",
  "bookingConverted",
  "bookingConfirmed",
  "holdExtended",
  "holdExpired",
  "statusChange",
  "itemUpdate",
  "allocationReleased",
  "fulfillmentIssued",
  "fulfillmentUpdated",
  "redemptionRecorded",
  "supplierUpdate",
  "passengerUpdate",
  "noteAdded",
]);

export type ConnectBookingActivityType = z.infer<
  typeof connectBookingActivityTypeEnum
>;

export const connectExtraSelectionTypeEnum = z.enum([
  "optional",
  "required",
  "defaultSelected",
  "unavailable",
]);

export type ConnectExtraSelectionType = z.infer<
  typeof connectExtraSelectionTypeEnum
>;

export const connectExtraPricingModeEnum = z.enum([
  "included",
  "perPerson",
  "perBooking",
  "quantityBased",
  "onRequest",
  "free",
]);

export type ConnectExtraPricingMode = z.infer<
  typeof connectExtraPricingModeEnum
>;

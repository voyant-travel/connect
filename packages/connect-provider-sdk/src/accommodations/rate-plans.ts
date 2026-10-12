import { z } from "zod";

import { boardCodeEnum } from "./primitives.js";
import { connectEntityMetaSchema } from "./metadata.js";
import {
  cancellationPolicySchema,
  occupancyPricingModeEnum,
  ratePlanGuaranteeModeEnum,
  ratePlanPricingModeEnum,
} from "./shared.js";

export const ratePlanRestrictionsSchema = z.object({
  minStay: z.number().int().min(1).optional(),
  maxStay: z.number().int().min(1).optional(),
  advancePurchaseDays: z.number().int().nonnegative().optional(),
  closedToArrivalWeekdays: z.array(z.number().int().min(0).max(6)).optional(),
  closedToDepartureWeekdays: z.array(z.number().int().min(0).max(6)).optional(),
});

export type RatePlanRestrictions = z.infer<typeof ratePlanRestrictionsSchema>;

export const ratePlanSchema = z.object({
  id: z.string(),
  connectionId: z.string(),
  accommodationId: z.string(),
  roomTypeId: z.string(),
  externalId: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string().optional(),
  board: boardCodeEnum,
  refundable: z.boolean(),
  cancellationPolicy: cancellationPolicySchema,
  guaranteeMode: ratePlanGuaranteeModeEnum,
  currency: z.string().length(3),
  occupancyPricingMode: occupancyPricingModeEnum,
  pricingMode: ratePlanPricingModeEnum,
  restrictions: ratePlanRestrictionsSchema.optional(),
  locale: z.string().min(2),
  meta: connectEntityMetaSchema,
});

export type RatePlan = z.infer<typeof ratePlanSchema>;

import { z } from "zod";

import { connectEntityMetaSchema } from "./metadata.js";
import {
  accommodationCategoryEnum,
  accommodationContactSchema,
  accommodationImageSchema,
  accommodationLocationSchema,
  accommodationPoliciesSchema,
  accommodationRatingSchema,
  bedTypeEnum,
} from "./shared.js";

export const accommodationSchema = z.object({
  id: z.string(),
  connectionId: z.string(),
  externalId: z.string(),
  category: accommodationCategoryEnum,
  name: z.string(),
  slug: z.string().optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  rating: accommodationRatingSchema.optional(),
  location: accommodationLocationSchema,
  contact: accommodationContactSchema.optional(),
  amenities: z.array(z.string()),
  policies: accommodationPoliciesSchema,
  images: z.array(accommodationImageSchema),
  taxesIncludedInPrice: z.boolean().optional(),
  locale: z.string().min(2),
  meta: connectEntityMetaSchema,
});

export type Accommodation = z.infer<typeof accommodationSchema>;

export const roomTypeOccupancySchema = z.object({
  maxAdults: z.number().int().min(1),
  maxChildren: z.number().int().nonnegative().default(0),
  maxInfants: z.number().int().nonnegative().default(0),
  maxTotal: z.number().int().min(1),
  standardOccupancy: z.number().int().min(1),
});

export type RoomTypeOccupancy = z.infer<typeof roomTypeOccupancySchema>;

export const roomTypeBedSchema = z.object({
  type: bedTypeEnum,
  count: z.number().int().min(1),
});

export const roomTypeSchema = z.object({
  id: z.string(),
  connectionId: z.string(),
  accommodationId: z.string(),
  externalId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  occupancy: roomTypeOccupancySchema,
  beds: z.array(roomTypeBedSchema),
  area: z
    .object({ value: z.number(), unit: z.enum(["sqm", "sqft"]) })
    .optional(),
  view: z.string().optional(),
  amenities: z.array(z.string()),
  images: z.array(accommodationImageSchema),
  locale: z.string().min(2),
  meta: connectEntityMetaSchema,
});

export type RoomType = z.infer<typeof roomTypeSchema>;

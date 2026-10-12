import { z } from "zod";

import {
  connectDirectionEnum,
  connectEntityCategoryEnum,
  connectOperatingModeEnum,
  connectReadModeEnum,
  connectRefreshStrategyEnum,
  connectSourceOfTruthModeEnum,
} from "./enums.js";
import {
  connectDateTimeSchema,
  connectExternalReferenceSchema,
  connectMarketContextSchema,
} from "./primitives.js";

export const connectSourceSchema = z.object({
  connectionId: z.string().optional(),
  adapterKey: z.string(),
  providerKey: z.string(),
  direction: connectDirectionEnum,
  operatingMode: connectOperatingModeEnum,
  sourceOfTruthMode: connectSourceOfTruthModeEnum,
  categories: z.array(connectEntityCategoryEnum).min(1),
});

export type ConnectSource = z.infer<typeof connectSourceSchema>;

export const connectFreshnessSchema = z.object({
  readMode: connectReadModeEnum,
  refreshStrategy: connectRefreshStrategyEnum,
  refreshedAt: connectDateTimeSchema.nullable().optional(),
  expiresAt: connectDateTimeSchema.nullable().optional(),
  maxStalenessSeconds: z.number().int().nonnegative().nullable().optional(),
});

export type ConnectFreshness = z.infer<typeof connectFreshnessSchema>;

export const connectEntityMetaSchema = z.object({
  source: connectSourceSchema,
  freshness: connectFreshnessSchema.optional(),
  marketContext: connectMarketContextSchema.optional(),
  externalReferences: z.array(connectExternalReferenceSchema).optional(),
  createdAt: connectDateTimeSchema.optional(),
  updatedAt: connectDateTimeSchema.optional(),
});

export type ConnectEntityMeta = z.infer<typeof connectEntityMetaSchema>;

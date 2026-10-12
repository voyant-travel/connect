import { z } from "zod";

export const connectDateTimeSchema = z.string().min(1);

export type ConnectDateTime = z.infer<typeof connectDateTimeSchema>;

export const connectDateSchema = z.string().min(1);

export type ConnectDate = z.infer<typeof connectDateSchema>;

export const connectExternalReferenceSchema = z.object({
  system: z.string(),
  type: z.string(),
  value: z.string(),
});

export type ConnectExternalReference = z.infer<
  typeof connectExternalReferenceSchema
>;

export const connectMarketContextSchema = z.object({
  market: z.string().nullable().optional(),
  language: z.string().nullable().optional(),
  currency: z.string().nullable().optional(),
});

export type ConnectMarketContext = z.infer<typeof connectMarketContextSchema>;

export const connectMoneySchema = z.object({
  amountMinor: z.number().int(),
  currency: z.string().length(3),
  currencyPrecision: z.number().int().min(0).max(6),
});

export type ConnectMoney = z.infer<typeof connectMoneySchema>;

/**
 * Canonical board / meal-basis codes — a cross-vertical tourism standard, not
 * owned by any single vertical: accommodations rate plans, operator packages,
 * and cruise inclusions all describe what meals a price includes. Codes follow
 * the industry short form; they map to the upstream voyant long names as
 * `RO=room_only`, `BB=bed_breakfast`, `HB=half_board`, `FB=full_board`,
 * `AI=all_inclusive`.
 */
export const boardCodeEnum = z.enum(["RO", "BB", "HB", "FB", "AI"]);

export type BoardCode = z.infer<typeof boardCodeEnum>;

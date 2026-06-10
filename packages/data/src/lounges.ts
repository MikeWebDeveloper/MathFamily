import { z } from "zod";
import loungesJson from "../datasets/parkmath/lounges.json";
import priorityPassJson from "../datasets/parkmath/priority-pass.json";
import { IsoDate, Slug, HttpUrl } from "./zod-helpers";

export const LoungeSchema = z.strictObject({
  name: z.string().min(1),
  walkInPence: z.number().int().positive().nullable(),
  priorityPass: z.boolean(),
  notes: z.string().nullable()
});
export type Lounge = z.infer<typeof LoungeSchema>;

export const LoungeRecordSchema = z.strictObject({
  airportSlug: Slug,
  lounges: z.array(LoungeSchema).min(1),
  sourceUrl: HttpUrl,
  verifiedAt: IsoDate
});
export type LoungeRecord = z.infer<typeof LoungeRecordSchema>;

export const LoungeDatasetSchema = z.strictObject({
  version: z.string().min(1),
  lastUpdated: IsoDate,
  records: z.array(LoungeRecordSchema).min(1)
});
export type LoungeDataset = z.infer<typeof LoungeDatasetSchema>;

export const PriorityPassTierSchema = z.strictObject({
  tier: z.string().min(1),
  annualFeePence: z.number().int().positive(),
  includedVisits: z.number().int().nonnegative().nullable(),
  perVisitPence: z.number().int().nonnegative()
});
export type PriorityPassTier = z.infer<typeof PriorityPassTierSchema>;

export const PriorityPassSchema = z.strictObject({
  tiers: z.array(PriorityPassTierSchema).min(1),
  sourceUrl: HttpUrl,
  verifiedAt: IsoDate
});
export type PriorityPass = z.infer<typeof PriorityPassSchema>;

export function loadLoungeDataset(): LoungeDataset {
  return LoungeDatasetSchema.parse(loungesJson);
}
export function loadPriorityPass(): PriorityPass {
  return PriorityPassSchema.parse(priorityPassJson);
}

import { z } from "zod";
import baggageJson from "../datasets/roammath/baggage.json";
import { HttpUrl, IsoDate, Slug } from "./zod-helpers";

export const BaggageFeeSchema = z
  .strictObject({
    item: z.string().min(1),
    minPence: z.number().int().nonnegative().nullable(),
    maxPence: z.number().int().nonnegative().nullable(),
    note: z.string().nullable()
  })
  .refine((f) => f.minPence === null || f.maxPence === null || f.minPence <= f.maxPence, {
    message: "minPence must not exceed maxPence"
  });
export type BaggageFee = z.infer<typeof BaggageFeeSchema>;

export const BaggageRecordSchema = z.strictObject({
  airlineSlug: Slug,
  airlineName: z.string().min(1),
  fees: z.array(BaggageFeeSchema).min(1),
  dynamicPricingNote: z.string().nullable(),
  sourceUrl: HttpUrl,
  verifiedAt: IsoDate
});
export type BaggageRecord = z.infer<typeof BaggageRecordSchema>;

export const BaggageDatasetSchema = z.strictObject({
  version: z.string().min(1),
  lastUpdated: IsoDate,
  records: z.array(BaggageRecordSchema).min(1)
});
export type BaggageDataset = z.infer<typeof BaggageDatasetSchema>;

export function loadBaggageDataset(): BaggageDataset {
  return BaggageDatasetSchema.parse(baggageJson);
}

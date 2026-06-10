import { z } from "zod";

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");
const Slug = z.string().regex(/^[a-z0-9-]+$/, "expected lowercase-kebab slug");
const HttpUrl = z.string().regex(/^https?:\/\/\S+$/, "expected absolute http(s) URL");

export const AirportSchema = z.object({
  name: z.string().min(1),
  slug: Slug,
  iata: z.string().length(3),
  region: z.string().min(1)
});
export type Airport = z.infer<typeof AirportSchema>;
export const AirportsFileSchema = z.array(AirportSchema).min(1);

export const DropOffBandSchema = z.object({
  upToMinutes: z.number().int().positive(),
  totalPence: z.number().int().nonnegative()
});

export const DropOffRecordSchema = z
  .object({
    airportSlug: Slug,
    isFree: z.boolean(),
    feeSummary: z.string().min(1),
    bands: z.array(DropOffBandSchema),
    maxStayMinutes: z.number().int().positive().nullable(),
    penaltyPence: z.number().int().positive().nullable(),
    penaltyNotes: z.string().nullable(),
    paymentDeadline: z.string().nullable(),
    blueBadgePolicy: z.string().min(1),
    freeAlternative: z
      .object({ name: z.string().min(1), minutesFree: z.number().int().positive(), details: z.string().min(1) })
      .nullable(),
    priorYearFeePence: z.number().int().nonnegative().nullable(),
    sourceUrl: HttpUrl,
    verifiedAt: IsoDate
  })
  .refine((r) => r.isFree || r.bands.length > 0, { message: "non-free airports need at least one tariff band" });
export type DropOffRecord = z.infer<typeof DropOffRecordSchema>;

export const DropOffDatasetSchema = z.object({
  version: z.string().min(1),
  lastUpdated: IsoDate,
  records: z.array(DropOffRecordSchema).min(1)
});
export type DropOffDataset = z.infer<typeof DropOffDatasetSchema>;

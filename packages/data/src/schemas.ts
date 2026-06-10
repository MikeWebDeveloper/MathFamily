import { z } from "zod";

// Issue 1: IsoDate must be a real calendar date that round-trips
const IsoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD")
  .refine((s) => {
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }, "not a real calendar date");

// Issue 4: slug must not have leading/trailing/double dashes
const Slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "expected lowercase-kebab slug");
const HttpUrl = z.string().regex(/^https?:\/\/\S+$/, "expected absolute http(s) URL");

// Issue 2: strict objects; Issue 3: IATA must be exactly 3 uppercase letters
export const AirportSchema = z.strictObject({
  name: z.string().min(1),
  slug: Slug,
  iata: z.string().regex(/^[A-Z]{3}$/, "expected 3-letter uppercase IATA code"),
  region: z.string().min(1)
});
export type Airport = z.infer<typeof AirportSchema>;
export const AirportsFileSchema = z.array(AirportSchema).min(1);

export const DropOffBandSchema = z.strictObject({
  upToMinutes: z.number().int().positive(),
  totalPence: z.number().int().nonnegative()
});

export const DropOffRecordSchema = z
  .strictObject({
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
      .strictObject({ name: z.string().min(1), minutesFree: z.number().int().positive(), details: z.string().min(1) })
      .nullable(),
    priorYearFeePence: z.number().int().nonnegative().nullable(),
    sourceUrl: HttpUrl,
    verifiedAt: IsoDate
  })
  .refine((r) => r.isFree || r.bands.length > 0, { message: "non-free airports need at least one tariff band" });
export type DropOffRecord = z.infer<typeof DropOffRecordSchema>;

export const DropOffDatasetSchema = z.strictObject({
  version: z.string().min(1),
  lastUpdated: IsoDate,
  records: z.array(DropOffRecordSchema).min(1)
});
export type DropOffDataset = z.infer<typeof DropOffDatasetSchema>;

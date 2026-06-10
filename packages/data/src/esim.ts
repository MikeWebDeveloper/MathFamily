import { z } from "zod";
import esimJson from "../datasets/roammath/esim.json";
import { HttpUrl, IsoDate, Slug } from "./zod-helpers";

export const ESIM_PROVIDERS = ["airalo", "holafly", "saily"] as const;
export type EsimProvider = (typeof ESIM_PROVIDERS)[number];

export const EsimBundleSchema = z.strictObject({
  provider: z.enum(ESIM_PROVIDERS),
  bundleName: z.string().min(1),
  dataGb: z.number().positive().nullable(), // null = unlimited
  validityDays: z.number().int().positive(),
  totalPence: z.number().int().nonnegative(),
  snapshotDate: IsoDate
});
export type EsimBundle = z.infer<typeof EsimBundleSchema>;

export const EsimCountrySchema = z.strictObject({
  countrySlug: Slug,
  bundles: z.array(EsimBundleSchema).min(1),
  sourceUrl: HttpUrl,
  verifiedAt: IsoDate
});
export type EsimCountry = z.infer<typeof EsimCountrySchema>;

export const EsimDatasetSchema = z.strictObject({
  version: z.string().min(1),
  lastUpdated: IsoDate,
  records: z.array(EsimCountrySchema).min(1)
});
export type EsimDataset = z.infer<typeof EsimDatasetSchema>;

export function loadEsimDataset(): EsimDataset {
  return EsimDatasetSchema.parse(esimJson);
}

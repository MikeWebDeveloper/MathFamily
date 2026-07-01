import { z } from "zod";
import loungeAccessJson from "../datasets/loungemath/lounge-access.json";
import { IsoDate, Slug, HttpUrl } from "./zod-helpers";

// LoungeMath — per-airport airport-lounge access rules and break-even, UK.
// Records are Zod-parsed at load: a record without a verifiedAt date or an https
// sourceUrl, or with a non-integer value, FAILS the build. Never store fabricated
// or undated data here — that is the moat.
export const LoungeAccessRecordSchema = z.strictObject({
  key: Slug,
  name: z.string().min(1),
  // Single comparable price in INTEGER pence, or null when not priceable.
  valuePence: z.number().int().nonnegative().nullable(),
  summary: z.string().min(1),
  sourceUrl: HttpUrl,
  verifiedAt: IsoDate
});
export type LoungeAccessRecord = z.infer<typeof LoungeAccessRecordSchema>;

export const LoungeAccessDatasetSchema = z.strictObject({
  version: z.string().min(1),
  lastUpdated: IsoDate,
  // Starts empty. The schema permits an empty list so the skeleton builds, but
  // every row you add MUST carry verifiedAt + https sourceUrl or the build fails.
  records: z.array(LoungeAccessRecordSchema)
});
export type LoungeAccessDataset = z.infer<typeof LoungeAccessDatasetSchema>;

export function loadLoungeAccessDataset(): LoungeAccessDataset {
  return LoungeAccessDatasetSchema.parse(loungeAccessJson);
}

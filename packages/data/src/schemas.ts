import { z } from "zod";
import { IsoDate, Slug, HttpUrl } from "./zod-helpers";

// Issue 2: strict objects; Issue 3: IATA must be exactly 3 uppercase letters
export const AirportSchema = z.strictObject({
  name: z.string().min(1),
  slug: Slug,
  iata: z.string().regex(/^[A-Z]{3}$/, "expected 3-letter uppercase IATA code"),
  region: z.string().min(1),
  // Aerodrome coordinates (decimal degrees) — used only for map decoration
  lat: z.number().min(49.8).max(61),
  lng: z.number().min(-8.5).max(2)
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
    perMinuteAfterPence: z.number().int().positive().nullable(),
    maxChargePence: z.number().int().positive().nullable(),
    penaltyPence: z.number().int().positive().nullable(),
    penaltyNotes: z.string().nullable(),
    paymentDeadline: z.string().nullable(),
    blueBadgePolicy: z.string().min(1),
    // A genuinely free alternative to the forecourt charge, read from the airport's OWN page.
    //  - kind "car-park" (default when absent): a free car park / free-grace facility with a real
    //    `minutesFree` (positive int) — the classic "park here free for N minutes" model.
    //  - kind "public-transport": rail/DLR/tram that reaches the terminal so you never use the
    //    forecourt at all. There is no "free minutes" concept, so `minutesFree` is null.
    // minutesFree is therefore required (positive) for car-park alternatives and null for
    // public-transport ones — enforced by the refine below so we can never ship a transport
    // alternative with a fabricated minutes figure.
    freeAlternative: z
      .strictObject({
        name: z.string().min(1),
        kind: z.enum(["car-park", "public-transport"]).optional(),
        minutesFree: z.number().int().positive().nullable(),
        details: z.string().min(1)
      })
      .refine((a) => (a.kind === "public-transport" ? a.minutesFree === null : a.minutesFree !== null), {
        message: "car-park free alternatives need minutesFree; public-transport ones must have minutesFree null"
      })
      .nullable(),
    priorYearFeePence: z.number().int().nonnegative().nullable(),
    sourceUrl: HttpUrl,
    verifiedAt: IsoDate,
    // Optional per-airport SEO metadata overrides. PURELY for the SERP `<title>`/`<meta>` label —
    // they NEVER change a price, fee, policy or any displayed figure (those still come from the
    // fields above). When present, the route's `generateMetadata` uses them verbatim in place of
    // the generated template; when absent the template is used unchanged. We keep three pairs
    // because the same record powers three different pages with different intent:
    //   - seoTitle / seoDescription                       → /drop-off-charges/[airport]
    //   - blueBadgeSeoTitle / blueBadgeSeoDescription      → /blue-badge/[airport]
    //   - optionsSeoTitle / optionsSeoDescription          → /airport-parking-options/[airport]
    // Used to front-match the literal searched query on the page-1 quick-win / striking-distance
    // pages (2026-07-12 GSC striking-distance pass: real search-analytics data showed Google was
    // already ranking the parking-options page — not the dedicated drop-off-charges page — for
    // literal "[airport] drop off charge(s)" queries at some airports, but that page's generated
    // title never used the word "charge(s)" at all).
    seoTitle: z.string().min(1).optional(),
    seoDescription: z.string().min(1).optional(),
    blueBadgeSeoTitle: z.string().min(1).optional(),
    blueBadgeSeoDescription: z.string().min(1).optional(),
    optionsSeoTitle: z.string().min(1).optional(),
    optionsSeoDescription: z.string().min(1).optional()
  })
  .refine((r) => r.isFree || r.bands.length > 0, { message: "non-free airports need at least one tariff band" });
export type DropOffRecord = z.infer<typeof DropOffRecordSchema>;
export type FreeAlternative = NonNullable<DropOffRecord["freeAlternative"]>;

/** A free alternative is "public transport" (rail/DLR/tram to the terminal) when its kind says so.
 *  Absent kind is treated as the legacy default: a car park with free minutes. */
export function isPublicTransportAlt(alt: FreeAlternative): boolean {
  return alt.kind === "public-transport";
}

/** The honest one-clause "what it is" descriptor for a free alternative, used wherever copy used
 *  to hard-code "free for {minutesFree} minutes". Car parks state the free minutes; public
 *  transport states it reaches the terminal so the forecourt charge is avoided entirely. Pure. */
export function freeAltClause(alt: FreeAlternative): string {
  return isPublicTransportAlt(alt)
    ? `${alt.name} (reaches the terminal — no forecourt charge)`
    : `${alt.name} (free for ${alt.minutesFree} min)`;
}

export const DropOffDatasetSchema = z.strictObject({
  version: z.string().min(1),
  lastUpdated: IsoDate,
  records: z.array(DropOffRecordSchema).min(1)
});
export type DropOffDataset = z.infer<typeof DropOffDatasetSchema>;

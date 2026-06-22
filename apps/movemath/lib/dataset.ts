/**
 * MoveMath app-local seed dataset — the cost of moving home in England & Northern Ireland.
 *
 * Every figure carries a `sourceUrl` + `verifiedAt` (ISO date). All money is held in PENCE
 * (integer) to match the @mathfamily/engine `formatPence` convention and avoid float drift.
 *
 * SDLT (Stamp Duty Land Tax) rates are the well-known public gov.uk figures for England &
 * Northern Ireland (Scotland uses LBTT and Wales uses LTT — different systems, NOT covered).
 * Removals / conveyancing / survey ranges are typical figures from public consumer guides
 * (HomeOwners Alliance, Compare My Move). They are estimates, NOT quotes.
 *
 * RULE: never fabricate a rate. Anything that could not be confirmed against a public source
 * is flagged with `// TODO: verify` and labelled a placeholder.
 */

export const VERIFIED_AT = "2026-06-22";

// --- Stamp Duty Land Tax (England & Northern Ireland) ---------------------------------------
// Bands are marginal ("slice") bands: each rate applies only to the portion of the price
// within that band. Thresholds in pence. `upToPence: null` = top open-ended band.
// Source: https://www.gov.uk/stamp-duty-land-tax/residential-property-rates (verified 2026-06-22)

export interface SdltBand {
  /** Upper bound of this band, in pence. null = no upper bound (top band). */
  upToPence: number | null;
  /** Marginal rate as a decimal (0.05 = 5%). */
  rate: number;
}

export interface SdltScheme {
  bands: SdltBand[];
  sourceUrl: string;
  verifiedAt: string;
  note: string;
}

/** Standard residential rates — a home-mover buying their only/main residence. */
export const SDLT_STANDARD: SdltScheme = {
  bands: [
    { upToPence: 125_000_00, rate: 0.0 },
    { upToPence: 250_000_00, rate: 0.02 },
    { upToPence: 925_000_00, rate: 0.05 },
    { upToPence: 1_500_000_00, rate: 0.1 },
    { upToPence: null, rate: 0.12 }
  ],
  sourceUrl: "https://www.gov.uk/stamp-duty-land-tax/residential-property-rates",
  verifiedAt: VERIFIED_AT,
  note: "Standard residential SDLT bands, England & Northern Ireland (since 1 April 2025)."
};

/**
 * First-time buyer relief. 0% up to £300,000, then 5% on the slice £300,001–£500,000.
 * IMPORTANT GOV.UK RULE: if the price is OVER £500,000 the relief is unavailable entirely and
 * the STANDARD rates apply to the whole price. That cliff is handled in the engine, not here.
 * Source: https://www.gov.uk/stamp-duty-land-tax/residential-property-rates (verified 2026-06-22)
 */
export const SDLT_FIRST_TIME_BUYER: SdltScheme = {
  bands: [
    { upToPence: 300_000_00, rate: 0.0 },
    { upToPence: 500_000_00, rate: 0.05 },
    { upToPence: null, rate: 0.05 } // only reached via the >£500k cliff fallback (engine swaps to standard)
  ],
  sourceUrl: "https://www.gov.uk/stamp-duty-land-tax/residential-property-rates",
  verifiedAt: VERIFIED_AT,
  note: "First-time buyer relief: 0% to £300k, 5% to £500k. No relief on purchases over £500k."
};

/**
 * Additional-property / second-home surcharge: +5 percentage points on EVERY standard band
 * (including the 0% nil-rate band), for purchases over £40,000. Modelled as the standard bands
 * with +0.05 added to each rate. The engine applies the >£40k threshold gate.
 * Source: https://www.gov.uk/stamp-duty-land-tax/residential-property-rates (verified 2026-06-22)
 */
export const SDLT_ADDITIONAL_SURCHARGE_RATE = 0.05;
export const SDLT_ADDITIONAL_THRESHOLD_PENCE = 40_000_00;

export const SDLT_ADDITIONAL: SdltScheme = {
  bands: SDLT_STANDARD.bands.map((b) => ({ ...b, rate: b.rate + SDLT_ADDITIONAL_SURCHARGE_RATE })),
  sourceUrl: "https://www.gov.uk/stamp-duty-land-tax/residential-property-rates",
  verifiedAt: VERIFIED_AT,
  note: "Additional-property surcharge: standard bands +5% on every slice, for purchases over £40,000."
};

// --- Typical non-SDLT moving costs ----------------------------------------------------------
// These are TYPICAL RANGES from public consumer guides, not quotes. Each carries its own source.

export interface CostRange {
  key: string;
  label: string;
  lowPence: number;
  highPence: number;
  /** A single representative midpoint used in the headline total. */
  typicalPence: number;
  sourceUrl: string;
  verifiedAt: string;
  note: string;
}

/** Removals by property size — HomeOwners Alliance cost-of-moving guide (~10 mile local move). */
export const REMOVALS: CostRange[] = [
  {
    key: "removals-1-2-bed",
    label: "Removals — 1–2 bed",
    lowPence: 450_00,
    highPence: 550_00,
    typicalPence: 500_00,
    sourceUrl: "https://hoa.org.uk/cost-of-moving-calculator/",
    verifiedAt: VERIFIED_AT,
    note: "Local (~10 mile) move, one or two bedrooms. HomeOwners Alliance."
  },
  {
    key: "removals-3-bed",
    label: "Removals — 3 bed",
    lowPence: 700_00,
    highPence: 900_00,
    typicalPence: 800_00,
    sourceUrl: "https://hoa.org.uk/cost-of-moving-calculator/",
    verifiedAt: VERIFIED_AT,
    note: "Local (~10 mile) move, three bedrooms. HomeOwners Alliance."
  },
  {
    key: "removals-4-bed",
    label: "Removals — 4 bed",
    lowPence: 1_000_00,
    highPence: 1_200_00,
    typicalPence: 1_100_00,
    sourceUrl: "https://hoa.org.uk/cost-of-moving-calculator/",
    verifiedAt: VERIFIED_AT,
    note: "Local (~10 mile) move, four bedrooms. HomeOwners Alliance."
  },
  {
    key: "removals-5-bed",
    label: "Removals — 5 bed",
    lowPence: 1_300_00,
    highPence: 1_500_00,
    typicalPence: 1_400_00,
    sourceUrl: "https://hoa.org.uk/cost-of-moving-calculator/",
    verifiedAt: VERIFIED_AT,
    note: "Local (~10 mile) move, five bedrooms. HomeOwners Alliance."
  }
];

/** Conveyancing (legal) — buying. HomeOwners Alliance: £300–£1,500 legal fee + up to £700 disbursements. */
export const CONVEYANCING_BUY: CostRange = {
  key: "conveyancing-buy",
  label: "Conveyancing (buying)",
  lowPence: 800_00,
  highPence: 2_200_00,
  typicalPence: 1_500_00,
  sourceUrl: "https://hoa.org.uk/cost-of-moving-calculator/",
  verifiedAt: VERIFIED_AT,
  note: "Solicitor/licensed conveyancer legal fee plus disbursements (searches, Land Registry, etc.) when buying. HomeOwners Alliance."
};

/** Conveyancing (legal) — selling. HomeOwners Alliance: ~£600–£800 legal fees when selling. */
export const CONVEYANCING_SELL: CostRange = {
  key: "conveyancing-sell",
  label: "Conveyancing (selling)",
  lowPence: 600_00,
  highPence: 800_00,
  typicalPence: 700_00,
  sourceUrl: "https://hoa.org.uk/cost-of-moving-calculator/",
  verifiedAt: VERIFIED_AT,
  note: "Legal fees when selling your current home. HomeOwners Alliance. Only applies if you are also selling."
};

/** RICS surveys — levels 1/2/3. Averages from Compare My Move (2026). */
export const SURVEYS: CostRange[] = [
  {
    key: "survey-level-1",
    label: "RICS Home Survey Level 1 (condition report)",
    lowPence: 300_00,
    highPence: 900_00,
    typicalPence: 400_00,
    sourceUrl: "https://hoa.org.uk/cost-of-moving-calculator/",
    verifiedAt: VERIFIED_AT,
    note: "Basic condition report — newer / conventional homes. HomeOwners Alliance range."
  },
  {
    key: "survey-level-2",
    label: "RICS Home Survey Level 2 (HomeBuyer)",
    lowPence: 416_00,
    highPence: 639_00,
    typicalPence: 455_00,
    sourceUrl: "https://www.comparemymove.com/guides/surveying/level-2-survey-cost",
    verifiedAt: VERIFIED_AT,
    note: "Most common survey for conventional homes in reasonable condition. Compare My Move average £455."
  },
  {
    key: "survey-level-3",
    label: "RICS Home Survey Level 3 (Building Survey)",
    lowPence: 562_00,
    highPence: 945_00,
    typicalPence: 629_00,
    sourceUrl: "https://www.comparemymove.com/guides/surveying/level-3-survey-cost",
    verifiedAt: VERIFIED_AT,
    note: "Detailed survey for older, larger or unusual properties. Compare My Move average £629."
  }
];

/** Other typical costs. EPC + mortgage arrangement fee (the SDLT/figure is fine; no mortgage PRODUCT is promoted). */
export const OTHER_COSTS: CostRange[] = [
  {
    key: "epc",
    label: "Energy Performance Certificate (EPC)",
    lowPence: 60_00,
    highPence: 120_00,
    typicalPence: 90_00,
    sourceUrl: "https://hoa.org.uk/cost-of-moving-calculator/",
    verifiedAt: VERIFIED_AT,
    note: "Required when selling (if a valid EPC isn't already in place). HomeOwners Alliance."
  },
  {
    // The arrangement FEE is a generic moving cost (a number). MoveMath does NOT promote any
    // mortgage product, broker, or rate comparison — see the FCA-red gating in mortgage-slot.tsx.
    key: "mortgage-arrangement-fee",
    label: "Mortgage arrangement / product fee",
    lowPence: 500_00,
    highPence: 1_500_00,
    typicalPence: 1_000_00,
    sourceUrl: "https://hoa.org.uk/cost-of-moving-calculator/",
    verifiedAt: VERIFIED_AT,
    note: "Typical lender arrangement/product fee where one applies. A cost estimate only — MoveMath does not recommend or compare mortgage products."
  }
];

/** Estate-agent selling fee — percentage of sale price, only if you are also selling. */
export const ESTATE_AGENT_PCT = 0.0142; // 1.42% incl VAT, average 2026
export const ESTATE_AGENT_SOURCE = {
  sourceUrl: "https://hoa.org.uk/cost-of-moving-calculator/",
  verifiedAt: VERIFIED_AT,
  note: "Average UK estate agent fee 2026: 1.42% incl VAT (HomeOwners Alliance). Applies only when selling."
};

/** All distinct source citations, de-duplicated, for the SourcesBlock + sitemap freshness. */
export const ALL_SOURCES: { label: string; url: string; verifiedAt: string }[] = [
  { label: "gov.uk — Stamp Duty Land Tax residential rates", url: SDLT_STANDARD.sourceUrl, verifiedAt: VERIFIED_AT },
  { label: "HomeOwners Alliance — cost of moving calculator", url: "https://hoa.org.uk/cost-of-moving-calculator/", verifiedAt: VERIFIED_AT },
  { label: "Compare My Move — Level 2 survey cost", url: "https://www.comparemymove.com/guides/surveying/level-2-survey-cost", verifiedAt: VERIFIED_AT },
  { label: "Compare My Move — Level 3 survey cost", url: "https://www.comparemymove.com/guides/surveying/level-3-survey-cost", verifiedAt: VERIFIED_AT }
];

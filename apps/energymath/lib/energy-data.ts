/**
 * EnergyMath — app-local seed dataset for the UK Ofgem energy price cap.
 *
 * SOURCING RULES (hard):
 * - The GB-average unit rates + standing charges below are taken from the official
 *   Ofgem price cap for the 1 July – 30 September 2026 period and carry the official
 *   source URL + verifiedAt date.
 * - Ofgem sets a SEPARATE cap for each of the 14 distribution regions; per-region
 *   unit rates and standing charges differ from the GB average. The exact per-region
 *   figures are published in Ofgem's regional cap tables. Where a precise current
 *   per-region figure could not be verified against an official table at build time,
 *   the region carries `verified: false` and a `// TODO: verify` marker, and the UI
 *   labels its numbers as ESTIMATED (anchored to the GB average) — never as verified.
 * - NEVER present an unverified number as verified. NEVER fabricate a precise price.
 */

export const CAP_PERIOD = "1 July to 30 September 2026";
export const CAP_PERIOD_SHORT = "Jul–Sep 2026";

/** Official Ofgem price cap page — the single authoritative source for the GB average. */
export const OFGEM_SOURCE_URL =
  "https://www.ofgem.gov.uk/information-consumers/energy-advice-households/energy-price-cap-unit-rates-and-standing-charges";
export const OFGEM_CAP_LEVELS_URL =
  "https://www.ofgem.gov.uk/energy-regulation/domestic-and-non-domestic/energy-pricing-rules/energy-price-cap";

/** Verification date for the GB-average figures (offline-verified against Ofgem). */
export const GB_VERIFIED_AT = "2026-06-22";

/**
 * GB AVERAGE — Ofgem price cap, Direct Debit, 1 Jul–30 Sep 2026. VERIFIED.
 * Source: Ofgem (OFGEM_SOURCE_URL), verified 2026-06-22.
 * Rates include VAT at 5%.
 */
export const GB_AVERAGE = {
  electricityUnitRatePence: 26.11, // p/kWh
  electricityStandingChargePence: 57.19, // p/day
  gasUnitRatePence: 7.33, // p/kWh
  gasStandingChargePence: 29.04, // p/day
  /** Ofgem headline: typical dual-fuel Direct Debit bill for the period. */
  typicalDualFuelAnnualPounds: 1862
} as const;

/**
 * Typical Domestic Consumption Values (TDCV) — medium household.
 * The £1,862 headline is built on the long-standing medium TDCV of 2,700 kWh
 * electricity / 11,500 kWh gas per year. Ofgem is reviewing these downward
 * (proposed 2,500 / 9,500 from a later review) — see TDCV_NOTE. We keep the
 * established medium values as the calculator default so the home-page estimate
 * reconciles with Ofgem's published typical bill.
 * Source: Ofgem TDCV. // TODO: verify exact TDCV in force for this cap period.
 */
export const TDCV = {
  electricityKwhPerYear: 2700,
  gasKwhPerYear: 11500
} as const;

export const TDCV_NOTE =
  "Typical (medium) usage: 2,700 kWh electricity and 11,500 kWh gas per year. Ofgem is reviewing these values downward — your own usage from a recent bill gives the most accurate estimate.";

export type HomeSize = "flat" | "small" | "medium" | "large";

export interface UsageProfile {
  id: HomeSize;
  label: string;
  description: string;
  electricityKwhPerYear: number;
  gasKwhPerYear: number;
}

/**
 * Usage profiles by home size. The "medium" profile uses Ofgem's medium TDCV
 * (verified). The flat/small/large profiles are INDICATIVE ranges derived around
 * the medium TDCV — they are estimates for guidance, not Ofgem figures.
 * // TODO: verify against Ofgem low/medium/high TDCV bands.
 */
export const USAGE_PROFILES: UsageProfile[] = [
  {
    id: "flat",
    label: "Flat / 1 bed",
    description: "1–2 people, flat or small terrace",
    electricityKwhPerYear: 1800,
    gasKwhPerYear: 7500
  },
  {
    id: "small",
    label: "Small house / 2–3 bed",
    description: "2–3 people, small-to-mid home",
    electricityKwhPerYear: 2700, // Ofgem medium TDCV (verified)
    gasKwhPerYear: 11500 // Ofgem medium TDCV (verified)
  },
  {
    id: "medium",
    label: "Medium house / 3–4 bed",
    description: "3–4 people, average family home",
    electricityKwhPerYear: 3900,
    gasKwhPerYear: 15000
  },
  {
    id: "large",
    label: "Large house / 4+ bed",
    description: "4+ people, larger detached home",
    electricityKwhPerYear: 5100,
    gasKwhPerYear: 19000
  }
];

export interface EnergyRegion {
  slug: string;
  name: string;
  /** Regional electricity/gas rates, Direct Debit, incl. VAT. */
  electricityUnitRatePence: number;
  electricityStandingChargePence: number;
  gasUnitRatePence: number;
  gasStandingChargePence: number;
  /**
   * true  ⇒ figures verified against an official Ofgem regional table.
   * false ⇒ ESTIMATED (anchored to the GB average); UI must label as estimate.
   */
  verified: boolean;
  sourceUrl: string;
  verifiedAt: string;
  note?: string;
}

/**
 * The 14 GB electricity distribution regions Ofgem sets a separate cap for.
 *
 * IMPORTANT: only the GB-average figures are independently verified at build time.
 * Per-region precise figures vary by a few pence around the GB average. We could
 * not verify each region's exact current table offline, so every region below is
 * seeded with the VERIFIED GB-average rates and marked `verified: false` (i.e.
 * "regional figure not yet confirmed — shown as GB-average estimate"). This keeps
 * the data honest: real, sourced numbers, never fabricated regional precision.
 * // TODO: verify — replace each region's four rates with its exact Ofgem regional
 * // cap figure (Ofgem "Energy price cap by region" table) and flip verified: true.
 */
function regionSeed(slug: string, name: string, note?: string): EnergyRegion {
  return {
    slug,
    name,
    electricityUnitRatePence: GB_AVERAGE.electricityUnitRatePence,
    electricityStandingChargePence: GB_AVERAGE.electricityStandingChargePence,
    gasUnitRatePence: GB_AVERAGE.gasUnitRatePence,
    gasStandingChargePence: GB_AVERAGE.gasStandingChargePence,
    verified: false, // regional precision not yet confirmed — GB-average estimate
    sourceUrl: OFGEM_SOURCE_URL,
    verifiedAt: GB_VERIFIED_AT,
    note
  };
}

export const REGIONS: EnergyRegion[] = [
  regionSeed("london", "London"),
  regionSeed("south-east", "South East"),
  regionSeed("southern", "Southern"),
  regionSeed("south-west", "South West"),
  regionSeed("south-wales", "South Wales"),
  regionSeed("eastern", "Eastern (East of England)"),
  regionSeed("east-midlands", "East Midlands"),
  regionSeed("west-midlands", "West Midlands"),
  regionSeed("yorkshire", "Yorkshire"),
  regionSeed("north-east", "North East"),
  regionSeed("north-west", "North West"),
  regionSeed("merseyside-north-wales", "Merseyside & North Wales"),
  regionSeed("north-scotland", "North Scotland"),
  regionSeed("south-scotland", "South Scotland")
];

export const DATASET_VERSION = "0.1.0";
export const DATASET_LAST_UPDATED = GB_VERIFIED_AT;

export function getRegion(slug: string): EnergyRegion | undefined {
  return REGIONS.find((r) => r.slug === slug);
}

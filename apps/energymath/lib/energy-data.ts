/**
 * EnergyMath — app-local seed dataset for the UK Ofgem energy price cap.
 *
 * SOURCING RULES (hard):
 * - The GB-average unit rates + standing charges below are taken from the official
 *   Ofgem price cap for the 1 July – 30 September 2026 period and carry the official
 *   source URL + verifiedAt date.
 * - Ofgem sets a SEPARATE cap for each of the 14 distribution regions; per-region
 *   unit rates and standing charges differ from the GB average. The exact per-region
 *   figures are published in Ofgem's regional cap tables. All 14 regions below carry
 *   their REAL per-region Direct Debit rates derived directly from Ofgem's official
 *   "Final levelised cap rates model (Annex 9): 1 July to 30 September 2026" and are
 *   marked `verified: true`.
 * - NEVER present an unverified number as verified. NEVER fabricate a precise price.
 *
 * DERIVATION (per region, Direct Debit, incl. 5% VAT):
 * - Ofgem's Annex 9 tab "1a Levelised DTC" publishes, per region, the LEVELISED
 *   "Other Payment Method" benchmark maximum charges in £/customer/year, excl. VAT,
 *   as two points: "Nil kWh" (standing charge only) and "m" (at benchmark consumption).
 *   In the levelised cap, "Other Payment Method" IS the Direct Debit method — its GB
 *   average reconstructs EXACTLY to Ofgem's published DD consumer figures
 *   (26.11p/kWh & 57.19p/day electricity; 7.33p/kWh & 29.04p/day gas), which is how
 *   this derivation was validated.
 * - standingChargePence = Nil(£) × 1.05 (VAT) ÷ 365 × 100
 * - unitRatePence       = (m(£) − Nil(£)) × 1.05 (VAT) ÷ benchmarkKwh × 100
 *   with benchmark consumption (P16b, May 2026 TDCV review): 2,500 kWh electricity
 *   (single-rate) and 9,500 kWh gas.
 * Source file: Annex 9, 1 Jul–30 Sep 2026 (linked from OFGEM_SOURCE_URL). Verified 2026-06-22.
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
  typicalDualFuelAnnualPounds: 1663
} as const;

/**
 * Typical Domestic Consumption Values (TDCV) — medium household.
 * Ofgem's "Review of typical domestic consumption values" (decision published
 * 27 May 2026) took effect **1 July 2026**: the medium TDCV moved from
 * 2,700 → 2,500 kWh electricity and 11,500 → 9,500 kWh gas per year, which in
 * turn moves the headline "typical" dual-fuel bill from £1,862 (old basis) to
 * £1,663 (new basis) for the same 1 Jul–30 Sep 2026 unit rates/standing charges.
 * Re-verified live against Ofgem's price-cap announcement + MoneySavingExpert
 * on TDCV_VERIFIED_AT below — see research/energymath-data-reverify-2026-07-01.md.
 * Source: Ofgem TDCV review.
 */
export const TDCV = {
  electricityKwhPerYear: 2500,
  gasKwhPerYear: 9500
} as const;

export const TDCV_VERIFIED_AT = "2026-07-01";

export const TDCV_NOTE =
  "Typical (medium) usage: 2,500 kWh electricity and 9,500 kWh gas per year (Ofgem's updated TDCV, in force from 1 July 2026). Your own usage from a recent bill gives the most accurate estimate.";

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
    electricityKwhPerYear: 2500, // Ofgem medium TDCV (verified, in force from 1 Jul 2026)
    gasKwhPerYear: 9500 // Ofgem medium TDCV (verified, in force from 1 Jul 2026)
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
 * Every region below carries its REAL per-region Direct Debit rates derived from
 * Ofgem's official "Final levelised cap rates model (Annex 9): 1 July to 30 September
 * 2026" (the "1a Levelised DTC" tab, "Other Payment Method" block, which is the
 * Direct Debit method in the levelised cap). All figures include 5% VAT. The
 * derivation was validated because the GB average reconstructs EXACTLY to Ofgem's
 * published DD figures (26.11/57.19 electricity, 7.33/29.04 gas). See file header.
 *
 * The `region` field documents Ofgem's own region label (which differs in wording
 * from the consumer-friendly `name`): Ofgem "Northern" = North East England,
 * "Midlands" = West Midlands, "Southern Western" = South West.
 */
function region(
  slug: string,
  name: string,
  ofgemRegion: string,
  elecUnit: number,
  elecStanding: number,
  gasUnit: number,
  gasStanding: number
): EnergyRegion {
  return {
    slug,
    name,
    electricityUnitRatePence: elecUnit,
    electricityStandingChargePence: elecStanding,
    gasUnitRatePence: gasUnit,
    gasStandingChargePence: gasStanding,
    verified: true,
    sourceUrl: OFGEM_SOURCE_URL,
    verifiedAt: GB_VERIFIED_AT,
    note: `Direct Debit, incl. VAT. Derived from Ofgem Annex 9 levelised cap rates (1 Jul–30 Sep 2026), region "${ofgemRegion}".`
  };
}

// Per-region Direct Debit rates (p/kWh unit rate, p/day standing charge), incl. VAT.
// Source: Ofgem Annex 9 "1a Levelised DTC" (Other Payment Method = Direct Debit),
// 1 Jul–30 Sep 2026. Verified 2026-06-22. GB average reconstructs to 26.11/57.19/7.33/29.04.
export const REGIONS: EnergyRegion[] = [
  //      slug                      name                        Ofgem region          elecU  elecSC  gasU  gasSC
  region("london",                 "London",                   "London",             26.35, 44.78, 7.5,  29.52),
  region("south-east",             "South East",               "South East",         26.67, 54.45, 7.39, 28.63),
  region("southern",               "Southern",                 "Southern",           26.42, 49.7,  7.53, 28.53),
  region("south-west",             "South West",               "Southern Western",   26.39, 57.89, 7.48, 28.68),
  region("south-wales",            "South Wales",              "South Wales",        26.33, 57.84, 7.42, 29.3),
  region("eastern",                "Eastern (East of England)","Eastern",            26.38, 53.94, 7.26, 28.7),
  region("east-midlands",          "East Midlands",            "East Midlands",      25.1,  53.6,  7.19, 28.78),
  region("west-midlands",          "West Midlands",            "Midlands",           25.33, 59.71, 7.27, 29.06),
  region("yorkshire",              "Yorkshire",                "Yorkshire",          25.3,  64.38, 7.27, 29.12),
  region("north-east",             "North East",               "Northern",           25.22, 64.29, 7.28, 29.15),
  region("north-west",             "North West",               "North West",         26.13, 47.61, 7.24, 29.17),
  region("merseyside-north-wales", "Merseyside & North Wales", "N Wales and Mersey", 27.66, 70.76, 7.28, 29.42),
  region("north-scotland",         "North Scotland",           "Northern Scotland",  26.42, 57.55, 7.23, 29.22),
  region("south-scotland",         "South Scotland",           "Southern Scotland",  25.85, 64.17, 7.23, 29.24)
];

export const DATASET_VERSION = "0.1.0";
export const DATASET_LAST_UPDATED = GB_VERIFIED_AT;

export function getRegion(slug: string): EnergyRegion | undefined {
  return REGIONS.find((r) => r.slug === slug);
}

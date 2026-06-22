/**
 * App-local domain types for BroadbandMath. Kept here (NOT in @mathfamily/data)
 * because the broadband true-cost model is specific to this app.
 *
 * Money is stored in integer pence to match the @mathfamily/engine money convention
 * (formatPence). Monthly prices, exit fees and out-of-contract prices are all pence.
 */

/** How a provider raises price mid-contract. The 2025+ industry shift (driven by Ofcom's
 *  ban on CPI/RPI-linked rises for contracts signed on/after 17 Jan 2025) is fixed
 *  pounds-and-pence rises stated up front. Older/legacy contracts may still be inflation-linked. */
export type PriceRiseType =
  | "fixed_pence" // a fixed £X.XX/month rise stated in the contract (pence)
  | "cpi_plus" // legacy: CPI + a fixed percentage, applied annually
  | "rpi_plus" // legacy: RPI + a fixed percentage, applied annually
  | "none"; // genuinely no in-contract rise (rare; e.g. some social tariffs / fixed-price deals

export interface PriceRiseTerm {
  type: PriceRiseType;
  /** For fixed_pence: the monthly increase in pence applied each April. */
  fixedPencePerMonth?: number;
  /** For cpi_plus / rpi_plus: the fixed percentage added on top of the index, e.g. 3.9. */
  plusPercent?: number;
  /** Assumed index rate used for projection of legacy inflation-linked deals, e.g. 4.0 (%).
   *  Only an assumption for illustration — labelled as such in the UI. */
  assumedIndexPercent?: number;
  /** Human-readable summary of the published term. */
  summary: string;
}

export interface BroadbandPlan {
  /** Unique slug, e.g. "bt-fibre-2". */
  slug: string;
  provider: string; // display name, e.g. "BT"
  providerSlug: string; // e.g. "bt"
  planName: string; // e.g. "Fibre 2"
  /** Advertised/headline download speed in Mbps. */
  speedMbps: number;
  /** Speed tier bucket for /speed/[tier] spokes. */
  speedTier: SpeedTierSlug;
  /** Advertised monthly price in pence (the price you sign up at). */
  advertisedMonthlyPence: number;
  /** Contract length in months (e.g. 24). */
  contractMonths: number;
  /** Monthly price after the contract ends, if you don't switch, in pence. */
  outOfContractMonthlyPence: number;
  /** One-off up-front cost in pence (setup/activation/router delivery). 0 if none. */
  upfrontPence: number;
  /** Early-exit fee model: total remaining-months charge is the usual UK approach,
   *  but we store a representative single figure for the calculator's default. */
  exitFeePence: number;
  priceRise: PriceRiseTerm;
  sourceUrl: string;
  /** ISO date (YYYY-MM-DD) the figure was checked against the source. */
  verifiedAt: string;
  /** false ⇒ figure could not be confirmed offline; shown as a labelled placeholder. */
  verified: boolean;
  notes?: string;
}

export type SpeedTierSlug = "essential" | "fast" | "superfast" | "ultrafast" | "gigabit";

export interface SpeedTier {
  slug: SpeedTierSlug;
  name: string;
  /** Inclusive Mbps range [min, max]; max null = open-ended. */
  minMbps: number;
  maxMbps: number | null;
  blurb: string;
}

export interface BroadbandDataset {
  version: string;
  lastUpdated: string; // YYYY-MM-DD
  plans: BroadbandPlan[];
  speedTiers: SpeedTier[];
}

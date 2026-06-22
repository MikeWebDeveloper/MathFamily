/**
 * SDLT (Stamp Duty Land Tax) calculation — England & Northern Ireland only.
 *
 * Pure functions over the public gov.uk marginal-band schemes in dataset.ts. All money is in
 * PENCE (integer). These compute the TAX only; the full cost-to-move total lives in cost.ts.
 *
 * NOTE: Scotland (LBTT) and Wales (LTT) use different systems and are out of scope — the UI
 * states this explicitly. SDLT is public gov.uk data, so calculating it is fine; no mortgage
 * product is ever promoted (see mortgage-slot.tsx for the FCA-red gating).
 */

import {
  SDLT_STANDARD,
  SDLT_FIRST_TIME_BUYER,
  SDLT_ADDITIONAL,
  SDLT_ADDITIONAL_THRESHOLD_PENCE,
  type SdltBand
} from "./dataset";

export type BuyerType = "first-time-buyer" | "home-mover" | "additional-property";

/** First-time-buyer relief is unavailable above this price; standard rates apply to the whole price. */
export const FTB_RELIEF_CLIFF_PENCE = 500_000_00;

export interface SdltBandResult {
  rate: number;
  /** Slice of the price taxed at this rate, in pence. */
  slicePence: number;
  /** Tax due on this slice, in pence (rounded to the nearest penny). */
  taxPence: number;
}

export interface SdltResult {
  buyerType: BuyerType;
  pricePence: number;
  totalTaxPence: number;
  /** Effective rate across the whole price (0..1). */
  effectiveRate: number;
  breakdown: SdltBandResult[];
  /** True when FTB relief was requested but the price exceeded the £500k cliff, so standard applied. */
  ftbReliefLost: boolean;
}

/** Apply a set of marginal bands to a price (pence). Each band's rate hits only its own slice. */
function applyBands(pricePence: number, bands: SdltBand[]): SdltBandResult[] {
  const results: SdltBandResult[] = [];
  let lower = 0;
  for (const band of bands) {
    const upper = band.upToPence ?? Number.POSITIVE_INFINITY;
    if (pricePence <= lower) break;
    const slicePence = Math.min(pricePence, upper) - lower;
    if (slicePence > 0) {
      results.push({
        rate: band.rate,
        slicePence,
        taxPence: Math.round(slicePence * band.rate)
      });
    }
    lower = upper;
  }
  return results;
}

/**
 * Calculate SDLT for a purchase. `pricePence` is the purchase price in pence.
 *
 * - home-mover → standard bands.
 * - first-time-buyer → FTB relief, UNLESS price > £500k (then standard bands apply to whole price).
 * - additional-property → standard bands + 5% on every slice, but only if price > £40,000;
 *   at/under £40,000 no surcharge applies and it falls back to standard.
 */
export function calculateSdlt(pricePence: number, buyerType: BuyerType): SdltResult {
  const price = Math.max(0, Math.round(pricePence));

  let bands: SdltBand[];
  let ftbReliefLost = false;

  if (buyerType === "first-time-buyer") {
    if (price > FTB_RELIEF_CLIFF_PENCE) {
      bands = SDLT_STANDARD.bands;
      ftbReliefLost = true;
    } else {
      bands = SDLT_FIRST_TIME_BUYER.bands;
    }
  } else if (buyerType === "additional-property") {
    // Surcharge only bites above £40k; otherwise it's a standard purchase.
    bands = price > SDLT_ADDITIONAL_THRESHOLD_PENCE ? SDLT_ADDITIONAL.bands : SDLT_STANDARD.bands;
  } else {
    bands = SDLT_STANDARD.bands;
  }

  const breakdown = applyBands(price, bands);
  const totalTaxPence = breakdown.reduce((sum, b) => sum + b.taxPence, 0);
  const effectiveRate = price > 0 ? totalTaxPence / price : 0;

  return { buyerType, pricePence: price, totalTaxPence, effectiveRate, breakdown, ftbReliefLost };
}

export const BUYER_TYPE_LABELS: Record<BuyerType, string> = {
  "first-time-buyer": "First-time buyer",
  "home-mover": "Home mover (next main home)",
  "additional-property": "Additional / second property"
};

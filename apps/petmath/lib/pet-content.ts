import { formatPence } from "@mathfamily/engine";
import { INSURANCE_ESTIMATE, type PetCostRecord } from "./pet-costs";

/** A computed lifetime cost breakdown for a pet over a chosen number of years. */
export interface LifetimeEstimate {
  /** Years used in the calculation. */
  years: number;
  /** One-off set-up cost, in pence. */
  setupPence: number;
  /** Total ongoing essential care over the period (monthly × 12 × years), in pence. */
  carePence: number;
  /** Standalone insurance reference line over the period, in pence — only when includeInsurance. */
  insurancePence: number;
  /** Grand total, in pence. */
  totalPence: number;
}

/**
 * Lifetime cost for a record over `years`.
 *
 * The PDSA monthly figure already includes a typical insurance line. So:
 *  - includeInsurance = false (default): total = set-up + (monthly × 12 × years), using PDSA as-is.
 *  - includeInsurance = true: we show the ABI average premium as a *separate visible line* for
 *    people who want to see insurance broken out as its own number. To avoid double-counting we do
 *    NOT also add it into care — it is surfaced as `insurancePence` for display, and the engine
 *    still reports the PDSA-based `carePence` unchanged. The standalone line is therefore additive
 *    context, clearly labelled in the UI as "already included in the monthly figure above".
 */
export function lifetimeEstimate(
  record: Pick<PetCostRecord, "monthlyCarePence" | "setupPence">,
  years: number,
  includeInsurance = false
): LifetimeEstimate {
  if (!Number.isFinite(years) || years <= 0) {
    throw new Error(`lifetimeEstimate expects a positive number of years, got ${years}`);
  }
  const months = Math.round(years * 12);
  const carePence = record.monthlyCarePence * months;
  const insurancePence = includeInsurance ? INSURANCE_ESTIMATE.annualPremiumPence * Math.round(years) : 0;
  return {
    years,
    setupPence: record.setupPence,
    carePence,
    insurancePence,
    // Insurance is a reference line only (already inside the PDSA monthly) — never summed into the total.
    totalPence: record.setupPence + carePence,
  };
}

/** One-sentence verified answer for the AnswerLead / meta description. */
export function petAnswer(record: PetCostRecord): string {
  return `Owning a ${record.name.toLowerCase()} in the UK costs at least ${formatPence(record.lifetimeMinPence)}–${formatPence(record.lifetimeMaxPence)} over its lifetime — about ${formatPence(record.monthlyCarePence)} a month plus ${formatPence(record.setupPence)} in one-off set-up costs (PDSA, essential care only — emergency vet bills not included).`;
}

/** Short label for a lifetime range, e.g. "£6,200–£12,000". */
export function lifetimeRangeLabel(record: PetCostRecord): string {
  return `${formatPence(record.lifetimeMinPence)}–${formatPence(record.lifetimeMaxPence)}`;
}

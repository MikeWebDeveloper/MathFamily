import { compareParking, formatPence, type ParkingComparison } from "@mathfamily/engine";
import type { ParkingRecord } from "@mathfamily/data";

export const DURATION_SLUGS = ["3-days", "7-days", "14-days"] as const;
export type DurationSlug = (typeof DURATION_SLUGS)[number];

export function durationFromSlug(slug: string): number | null {
  const m = /^(\d+)-days$/.exec(slug);
  if (!m) return null;
  const days = Number(m[1]);
  return (DURATION_SLUGS as readonly string[]).includes(slug) ? days : null;
}

export interface ParkingPageModel extends ParkingComparison {
  answer: string;
}

export function parkingPageModel(record: ParkingRecord, days: number): ParkingPageModel {
  const comparison = compareParking(record, days);
  const answer = comparison.cheapest
    ? `The cheapest ${days}-day parking option in our verified data is ${comparison.cheapest.name} at ${formatPence(comparison.cheapest.totalPence)}${
        comparison.savingsVsGatePence ? `, saving ${formatPence(comparison.savingsVsGatePence)} against the drive-up gate price` : ""
      }.`
    : `No published prices cover ${days} days — check the official site.`;
  return { ...comparison, answer };
}

/** Honest CTA view-model for the parking booking card. Decides exactly what the affiliate CTA
 *  may claim for a given duration, derived ONLY from the verified comparison — never fabricated.
 *
 *  Three honest states:
 *   - "saving":   a real pre-book option beats the drive-up gate for THIS duration. We surface
 *                 the pre-book price plus the exact "save £X vs the £Y drive-up gate price" delta
 *                 (delta = gate − cheapest, integer pence).
 *   - "price":    a verified pre-book price exists for this duration but it is not cheaper than
 *                 the gate (or there is no gate to compare). Show the price, make NO saving claim.
 *   - "gate-only":the only verified figure for this duration is the drive-up gate price itself
 *                 (no pre-book snapshot covers it — the Stansted case). Showing the gate price as a
 *                 "from £X" pre-book figure would imply a discount that doesn't exist, so we surface
 *                 NO price and NO saving in the CTA. The card still links out honestly to pre-book.
 */
export interface ParkingCtaModel {
  state: "saving" | "price" | "gate-only";
  /** Price to surface in the CTA, integer pence. null in "gate-only" (no honest pre-book price). */
  pricePence: number | null;
  /** The drive-up gate price for this duration, integer pence, when known. */
  gatePence: number | null;
  /** Honest saving vs the drive-up gate, integer pence. Only set in the "saving" state. */
  savingVsGatePence: number | null;
  days: number;
}

export function parkingCtaModel(record: ParkingRecord, days: number): ParkingCtaModel {
  const m = compareParking(record, days);
  const gatePence = m.gate?.totalPence ?? null;

  // A genuine pre-book saving for this duration: cheapest beats the gate AND the cheapest is not
  // the gate product itself. savingsVsGatePence is null when the gate IS the cheapest (gate-only).
  if (m.savingsVsGatePence !== null && m.cheapest && m.cheapest.productType !== "gate") {
    return { state: "saving", pricePence: m.cheapest.totalPence, gatePence, savingVsGatePence: m.savingsVsGatePence, days };
  }

  // The only option for this duration is the drive-up gate price — never present it as a
  // discounted "from" pre-book figure. Suppress the price in the CTA (no fake saving, no fake price).
  if (m.cheapest && m.cheapest.productType === "gate") {
    return { state: "gate-only", pricePence: null, gatePence, savingVsGatePence: null, days };
  }

  // A real pre-book price exists but isn't cheaper than the gate (or there's no gate). Show the
  // price honestly with no saving claim.
  return { state: "price", pricePence: m.cheapest?.totalPence ?? null, gatePence, savingVsGatePence: null, days };
}

/** Returns the subset of covered durations (3, 7, 14) for which the record has at least one
 *  priced product. Uncovered durations are excluded so the UI never shows "No published price". */
export function coveredParkingDurations(record: ParkingRecord): number[] {
  return [3, 7, 14].filter((days) =>
    record.products.some((p) => p.prices.some((pr) => pr.days === days))
  );
}

export function buildParkingFaqs(record: ParkingRecord, airportName: string, days: number): { question: string; answer: string }[] {
  const model = parkingPageModel(record, days);
  const faqs: { question: string; answer: string }[] = [];
  if (model.cheapest) {
    faqs.push({
      question: `What is the cheapest ${days}-day parking at ${airportName}?`,
      answer: `${model.cheapest.name}: ${formatPence(model.cheapest.totalPence)} for ${days} days (verified ${record.verifiedAt}).`
    });
  }
  if (model.gate && model.cheapest && model.savingsVsGatePence) {
    faqs.push({
      question: `Is pre-booking ${airportName} parking cheaper than paying at the gate?`,
      answer: `Yes — for ${days} days, pre-booking (${formatPence(model.cheapest.totalPence)}) beats the gate rate (${formatPence(model.gate.totalPence)}) by ${formatPence(model.savingsVsGatePence)} in our latest verified snapshot.`
    });
  }
  faqs.push({
    question: `Where do these ${airportName} parking prices come from?`,
    answer: `Gate tariffs come from the airport's official published prices; pre-book figures are dated quote snapshots from the official booking portal. Nothing is scraped from third-party aggregators.`
  });
  return faqs;
}

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

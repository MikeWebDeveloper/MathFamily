import { formatPence } from "@mathfamily/engine";
import type { DropOffRecord } from "@mathfamily/data";

export function buildDropOffFaqs(record: DropOffRecord, airportName: string): { question: string; answer: string }[] {
  const faqs: { question: string; answer: string }[] = [
    { question: `How much is the drop-off charge at ${airportName}?`, answer: record.feeSummary }
  ];
  if (record.paymentDeadline) {
    faqs.push({
      question: `Can I pay the ${airportName} drop-off charge after I leave?`,
      answer: `Yes — pay by ${record.paymentDeadline}. ${record.penaltyNotes ?? ""}`.trim()
    });
  }
  faqs.push({
    question: `Are Blue Badge holders exempt from the ${airportName} drop-off fee?`,
    answer: record.blueBadgePolicy
  });
  if (record.freeAlternative) {
    faqs.push({
      question: `How do I avoid the ${airportName} drop-off fee?`,
      answer: `Use the ${record.freeAlternative.name} — free for ${record.freeAlternative.minutesFree} minutes. ${record.freeAlternative.details}`
    });
  }
  return faqs;
}

export function trendNote(record: DropOffRecord): string | null {
  const current = record.bands[0]?.totalPence;
  if (record.isFree || current === undefined || record.priorYearFeePence === null) return null;
  const diff = current - record.priorYearFeePence;
  if (diff === 0) return `Unchanged vs 2025 (${formatPence(current)})`;
  const direction = diff > 0 ? "Up" : "Down";
  return `${direction} ${formatPence(Math.abs(diff))} vs 2025 (${formatPence(record.priorYearFeePence)} → ${formatPence(current)})`;
}

export function isPerEntryTariff(record: DropOffRecord): boolean {
  const first = record.bands[0];
  return !record.isFree && record.bands.length === 1 && first !== undefined && first.upToMinutes <= 1;
}

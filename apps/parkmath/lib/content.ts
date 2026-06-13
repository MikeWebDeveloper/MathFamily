import { formatPence, loungeBreakEven } from "@mathfamily/engine";
import type { DropOffRecord, LoungeRecord, PriorityPassTier } from "@mathfamily/data";

export function buildDropOffFaqs(record: DropOffRecord, airportName: string): { question: string; answer: string }[] {
  const faqs: { question: string; answer: string }[] = [
    { question: `How much is the drop-off charge at ${airportName}?`, answer: `${record.feeSummary} (verified ${record.verifiedAt}, per the official ${airportName} page).` }
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

/** Unique, data-driven lounge FAQs. Surfaces each lounge's `notes` (operator/Priority Pass
 *  caveats) plus a membership break-even verdict, instead of two generic templated questions. */
export function buildLoungeFaqs(
  record: LoungeRecord,
  airportName: string,
  ppTiers: PriorityPassTier[]
): { question: string; answer: string }[] {
  const priced = record.lounges.filter((l) => l.walkInPence !== null);
  const cheapest = [...priced].sort((a, b) => a.walkInPence! - b.walkInPence!)[0];
  const ppLounges = record.lounges.filter((l) => l.priorityPass);
  const faqs: { question: string; answer: string }[] = [];

  faqs.push({
    question: `How much does an airport lounge cost at ${airportName}?`,
    answer: cheapest
      ? `Operator pre-book prices start at ${formatPence(cheapest.walkInPence!)} (${cheapest.name}), verified ${record.verifiedAt}. Walk-up rates on the day can be higher.`
      : `Walk-in prices aren't published for ${airportName} lounges — check the official lounge pages (verified ${record.verifiedAt}).`
  });

  faqs.push({
    question: `Which ${airportName} lounges accept Priority Pass?`,
    answer: ppLounges.length
      ? `${ppLounges.map((l) => l.name).join(", ")} accept Priority Pass at ${airportName}.`
      : `None of the tracked ${airportName} lounges currently list Priority Pass access.`
  });

  for (const lounge of record.lounges) {
    if (lounge.notes && lounge.notes.trim()) {
      const price = lounge.walkInPence !== null ? ` Pre-book from ${formatPence(lounge.walkInPence)}.` : "";
      faqs.push({
        question: `What should I know before visiting ${lounge.name} at ${airportName}?`,
        answer: `${lounge.notes}${price}`
      });
    }
  }

  if (cheapest) {
    const result = loungeBreakEven(cheapest.walkInPence!, 3, ppTiers);
    faqs.push({
      question: `Is a Priority Pass membership worth it at ${airportName}?`,
      answer:
        result.verdict === "membership" && result.savingsPence > 0
          ? `For frequent flyers, yes: at 3 visits a year a ${result.best?.tier} membership saves ${formatPence(result.savingsPence)} versus paying ${formatPence(cheapest.walkInPence!)} per visit (${cheapest.name}). Occasional visitors are better off paying on the day.`
          : `At 3 visits a year, paying per visit (${formatPence(result.payAsYouGoPence)}/year) beats membership at ${airportName} — it only pays off if you visit more often.`
    });
  }

  return faqs;
}

/** Answer-first summary for the drop-off index page: how many airports are free, and the
 *  cheapest/most-expensive of those that charge. Pure + unit-tested. */
export function dropOffIndexSummary(rows: { name: string; isFree: boolean; feePence: number }[]): string {
  const freeCount = rows.filter((r) => r.isFree).length;
  const paid = rows.filter((r) => !r.isFree).sort((a, b) => a.feePence - b.feePence);
  if (paid.length === 0) return `All ${rows.length} major UK airports let you drop off free.`;
  const cheapest = paid[0]!;
  const dearest = paid[paid.length - 1]!;
  return `${freeCount} of ${rows.length} major UK airports let you drop off free. Of those that charge, the cheapest is ${cheapest.name} at ${formatPence(cheapest.feePence)}; the most expensive is ${dearest.name} at ${formatPence(dearest.feePence)} (per drop-off, 2026).`;
}

export function trendNote(record: DropOffRecord): string | null {
  const current = record.bands[0]?.totalPence;
  if (record.isFree || current === undefined || record.priorYearFeePence === null) return null;
  if (record.priorYearFeePence === 0) return `New charge for 2026 (${formatPence(current)})`;
  const diff = current - record.priorYearFeePence;
  if (diff === 0) return `Unchanged vs 2025 (${formatPence(current)})`;
  const direction = diff > 0 ? "Up" : "Down";
  return `${direction} ${formatPence(Math.abs(diff))} vs 2025 (${formatPence(record.priorYearFeePence)} → ${formatPence(current)})`;
}

export function isPerEntryTariff(record: DropOffRecord): boolean {
  const first = record.bands[0];
  return !record.isFree && record.bands.length === 1 && first !== undefined && first.upToMinutes <= 1;
}

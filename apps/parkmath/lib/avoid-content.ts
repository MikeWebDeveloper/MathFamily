import { formatPence } from "@mathfamily/engine";
import { isPublicTransportAlt, type DropOffRecord, type FreeAlternative } from "@mathfamily/data";

/** "free for N minutes" for a car-park alternative, or the honest transport phrasing otherwise.
 *  Centralises the difference so no page hard-codes "free for {minutesFree} minutes". */
function altSavingClause(alt: FreeAlternative): string {
  return isPublicTransportAlt(alt) ? "reaching the terminal by public transport" : `free for ${alt.minutesFree} minutes`;
}

/** A record qualifies for an "avoid the drop-off charge" page only if it actually charges AND
 *  has a verified free alternative — there is nothing to "avoid" at a free airport, and we never
 *  invent a free option that the dataset doesn't carry. */
export function qualifiesForAvoidPage(
  record: Pick<DropOffRecord, "isFree" | "freeAlternative">
): boolean {
  return !record.isFree && record.freeAlternative !== null;
}

/** The headline fee (first/standard band), or null when the record is free / has no band. */
function headlinePence(record: Pick<DropOffRecord, "isFree" | "bands">): number | null {
  if (record.isFree) return null;
  return record.bands[0]?.totalPence ?? null;
}

/** The one-line answer that MUST render with JS off: name the free alternative and the saving.
 *  Every number here comes straight from the dataset (band total + minutesFree). */
export function avoidAnswer(record: DropOffRecord, airportName: string): string {
  const alt = record.freeAlternative;
  const fee = headlinePence(record);
  if (!alt || fee === null) {
    // Guarded by qualifiesForAvoidPage at the route; defensive fallback only.
    return `Drop-off at ${airportName} carries a forecourt charge — check the official page for free options.`;
  }
  return `To avoid the ${formatPence(fee)} ${airportName} drop-off charge, use the ${alt.name} — ${altSavingClause(alt)} — which saves you ${formatPence(fee)} per drop-off.`;
}

/** Supporting facts for the AnswerLead bullet list — only those backed by real data. */
export function avoidLeadFacts(record: DropOffRecord): string[] {
  const facts: string[] = [];
  const alt = record.freeAlternative;
  if (alt) facts.push(`Free alternative: ${alt.name}${isPublicTransportAlt(alt) ? " (public transport to the terminal)" : ` (${alt.minutesFree} min free)`}`);
  const fee = headlinePence(record);
  if (fee !== null) facts.push(`Forecourt charge avoided: ${formatPence(fee)} per drop-off`);
  if (record.paymentDeadline) facts.push(`If you do use the forecourt, pay by: ${record.paymentDeadline}`);
  if (record.penaltyPence !== null) facts.push(`Penalty for an unpaid forecourt visit: ${formatPence(record.penaltyPence)}`);
  return facts;
}

/** Ordered, data-driven steps for the HowTo schema + the on-page step list. Each step is built
 *  ONLY from verified record fields; we never add a generic/fabricated step. */
export function buildAvoidSteps(
  record: DropOffRecord,
  airportName: string
): { name: string; text: string }[] {
  const steps: { name: string; text: string }[] = [];
  const alt = record.freeAlternative;
  const fee = headlinePence(record);

  if (alt) {
    steps.push({
      name: `Use the ${alt.name}`,
      text: isPublicTransportAlt(alt)
        ? `${alt.details}${fee !== null ? ` That avoids the ${formatPence(fee)} forecourt charge entirely.` : ""}`
        : `${alt.details} You get ${alt.minutesFree} minutes free${
            fee !== null ? `, avoiding the ${formatPence(fee)} forecourt charge` : ""
          }.`
    });
  }

  // Blue Badge exemption is only a real "avoid" route where the policy text describes one.
  if (/exempt|discount|free|100%/i.test(record.blueBadgePolicy)) {
    steps.push({
      name: "Check Blue Badge exemption",
      text: record.blueBadgePolicy
    });
  }

  if (record.paymentDeadline) {
    steps.push({
      name: "If you do pay, don't miss the deadline",
      text: `If you can't avoid the forecourt, ${airportName} lets you pay by ${record.paymentDeadline}${
        record.penaltyPence !== null
          ? ` — missing it risks a ${formatPence(record.penaltyPence)} penalty`
          : ""
      }. ${record.penaltyNotes ?? ""}`.trim()
    });
  }

  return steps;
}

/** FAQs for the avoid page. Mirrors the drop-off FAQ style but is "avoidance"-led. */
export function buildAvoidFaqs(
  record: DropOffRecord,
  airportName: string
): { question: string; answer: string }[] {
  const faqs: { question: string; answer: string }[] = [];
  const alt = record.freeAlternative;
  const fee = headlinePence(record);

  if (alt) {
    faqs.push({
      question: `How do I avoid the ${airportName} drop-off charge?`,
      answer: `Use the ${alt.name} — ${altSavingClause(alt)}${
        fee !== null ? `, which avoids the ${formatPence(fee)} forecourt charge` : ""
      }. ${alt.details} (Verified ${record.verifiedAt}, per the official ${airportName} page.)`
    });
  }

  faqs.push({
    question: `Is there a free way to drop someone off at ${airportName}?`,
    answer: alt
      ? isPublicTransportAlt(alt)
        ? `Yes — arrive by the ${alt.name} instead of driving to the forecourt. ${alt.details}`
        : `Yes — the ${alt.name} gives you ${alt.minutesFree} minutes free. ${alt.details}`
      : `No free forecourt alternative is published for ${airportName}.`
  });

  faqs.push({
    question: `Are Blue Badge holders exempt from the ${airportName} drop-off fee?`,
    answer: record.blueBadgePolicy
  });

  if (record.paymentDeadline) {
    faqs.push({
      question: `If I use the ${airportName} forecourt, when do I have to pay?`,
      answer: `Pay by ${record.paymentDeadline}.${
        record.penaltyPence !== null ? ` Otherwise you risk a ${formatPence(record.penaltyPence)} penalty.` : ""
      } ${record.penaltyNotes ?? ""}`.trim()
    });
  }

  return faqs;
}

/** Answer-first summary for the avoid index page: how many of the charging airports have a
 *  verified free alternative, and the biggest single-drop-off saving available. Pure + tested. */
export function avoidIndexSummary(
  rows: { name: string; feePence: number; altName: string }[]
): string {
  if (rows.length === 0) return "No charging UK airport in our data currently publishes a free drop-off alternative.";
  const dearest = [...rows].sort((a, b) => b.feePence - a.feePence)[0]!;
  return `${rows.length} charging UK airports publish a verified free drop-off alternative. The biggest single saving is at ${dearest.name}: skip the ${formatPence(dearest.feePence)} forecourt fee by using the ${dearest.altName}.`;
}

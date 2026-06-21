import { formatPence } from "@mathfamily/engine";
import type { DropOffRecord } from "@mathfamily/data";

/** How the airport's published Blue Badge policy resolves, classified ONLY from the verbatim
 *  `blueBadgePolicy` prose the dataset carries. We never invent a policy: when the official page
 *  doesn't state a concession (or doesn't mention Blue Badge at all) we say so honestly.
 *
 *  - `exempt`  — Blue Badge holders pay nothing / get a 100% discount on the drop-off charge.
 *  - `free-window` — a free time window in a named car park (validate / register the badge).
 *  - `reduced` — a concession, but still a (lower or capped) charge — never £0.
 *  - `none`    — no Blue Badge concession is published, or the page is silent on it.
 */
export type BlueBadgeKind = "exempt" | "free-window" | "reduced" | "none";

/** Full exemption / 100% discount from the charge itself. */
const EXEMPT = /\bexempt\b|100% discount|free of charge where/i;

/** A GENUINE free time window: "free" tied to a window/car park (free for N min/hours, free access,
 *  free drop-off, free of charge, free set down, "N minutes free", "free in the …"). Deliberately
 *  narrow so a bare "no … free" sentence cannot trip it. */
const FREE_WINDOW =
  /free (?:for|access|drop-off|of charge|the first|set down)|free .{0,40}(?:minutes|hours|window)|(?:minutes|hours) free|free in the/i;

/** Phrases that mean "the official page publishes NO Blue Badge drop-off concession" (or is silent
 *  on it). Checked AFTER a genuine free window, so an airport that says "no concession in the
 *  Express area BUT 30 min free in Short Stay" is correctly read as a free window, not "none". */
const NO_CONCESSION = /no concession|no specific|not specifically stated|no published|no .{0,30}concession/i;

/** Classify the policy from its prose alone. Order: exempt → genuine free window → no-concession →
 *  else a reduced/standard concession (a charge still applies). Pure + exhaustively tested against
 *  all 25 real records. The full prose is ALWAYS rendered on the page regardless of bucket, so the
 *  classification only drives framing/sorting — it never replaces the official wording. */
export function classifyBlueBadge(policy: string): BlueBadgeKind {
  if (EXEMPT.test(policy)) return "exempt";
  if (FREE_WINDOW.test(policy)) return "free-window";
  if (NO_CONCESSION.test(policy)) return "none";
  return "reduced";
}

/** The headline drop-off fee (first/standard band), or null when free / unbanded. */
function headlinePence(record: Pick<DropOffRecord, "isFree" | "bands">): number | null {
  if (record.isFree) return null;
  return record.bands[0]?.totalPence ?? null;
}

/** Every airport with a populated `blueBadgePolicy` qualifies — and the dataset carries one for all
 *  25. We still guard against an empty string defensively (the schema enforces min length 1). */
export function qualifiesForBlueBadgePage(record: Pick<DropOffRecord, "blueBadgePolicy">): boolean {
  return record.blueBadgePolicy.trim().length > 0;
}

/** The one-line, number-first answer that MUST render with JS off. It states the honest outcome for
 *  a Blue Badge holder and ALWAYS defers to the official wording — it never asserts a £0 the policy
 *  doesn't grant. The full policy prose is rendered verbatim elsewhere on the page. */
export function blueBadgeAnswer(record: DropOffRecord, airportName: string): string {
  const kind = classifyBlueBadge(record.blueBadgePolicy);
  const fee = headlinePence(record);
  const feeStr = fee !== null ? formatPence(fee) : null;

  if (record.isFree) {
    // Free airport: there is no charge to be exempt from; still surface any badge window.
    return `Dropping off at ${airportName} is free for everyone, so there's no charge for Blue Badge holders to claim against. ${record.blueBadgePolicy}.`;
  }

  switch (kind) {
    case "exempt":
      return `Blue Badge holders can drop off free at ${airportName}${
        feeStr ? ` — the ${feeStr} forecourt charge is waived` : ""
      } when the exemption is registered as the airport requires: ${record.blueBadgePolicy}.`;
    case "free-window":
      return `${airportName} gives Blue Badge holders a free window rather than waiving the${
        feeStr ? ` ${feeStr}` : ""
      } forecourt charge directly: ${record.blueBadgePolicy}.`;
    case "reduced":
      return `${airportName} does not waive the${
        feeStr ? ` ${feeStr}` : ""
      } drop-off charge for Blue Badge holders, but publishes a concession: ${record.blueBadgePolicy}.`;
    case "none":
      return `${airportName} publishes no Blue Badge concession for the${
        feeStr ? ` ${feeStr}` : ""
      } drop-off forecourt: ${record.blueBadgePolicy}.`;
  }
}

/** A short, extractable chip label for the mini answer bar / index card. */
export function blueBadgeStatusLabel(record: DropOffRecord): string {
  if (record.isFree) return "Free for all";
  switch (classifyBlueBadge(record.blueBadgePolicy)) {
    case "exempt":
      return "Exempt — free if registered";
    case "free-window":
      return "Free window in a car park";
    case "reduced":
      return "Concession, not free";
    case "none":
      return "No concession published";
  }
}

/** Supporting facts for the AnswerLead bullet list — only lines backed by real record fields. */
export function blueBadgeLeadFacts(record: DropOffRecord): string[] {
  const facts: string[] = [];
  const fee = headlinePence(record);
  const kind = classifyBlueBadge(record.blueBadgePolicy);

  facts.push(`Blue Badge outcome: ${blueBadgeStatusLabel(record)}`);
  if (fee !== null) facts.push(`Standard forecourt charge: ${formatPence(fee)}`);
  if (kind === "exempt") facts.push("How: register the vehicle/badge as the airport's page requires");
  if (record.freeAlternative) {
    facts.push(`Free for everyone: ${record.freeAlternative.name} (${record.freeAlternative.minutesFree} min)`);
  }
  if (record.penaltyPence !== null) facts.push(`Penalty if a charge goes unpaid: ${formatPence(record.penaltyPence)}`);
  return facts;
}

/** Whether the policy describes an active step the holder must take (register / validate / show the
 *  badge). Only then do we render a HowTo — we never fabricate steps for a "no concession" airport. */
export function blueBadgeHasProcess(record: Pick<DropOffRecord, "blueBadgePolicy">): boolean {
  return /register|validate|sign in|show the badge|show .{0,20}badge|enter the .{0,30}number|scan the badge|buzzer|apply|claim|validating|validated/i.test(
    record.blueBadgePolicy
  );
}

/** Ordered HowTo steps, built ONLY from the verified policy + free-alternative fields. We never add
 *  a generic step. Returns [] when the policy describes no actionable process (then no HowTo schema). */
export function buildBlueBadgeSteps(
  record: DropOffRecord,
  airportName: string
): { name: string; text: string }[] {
  if (!blueBadgeHasProcess(record)) return [];
  const steps: { name: string; text: string }[] = [];
  const kind = classifyBlueBadge(record.blueBadgePolicy);

  steps.push({
    name: "Check you hold a valid Blue Badge",
    text: `The concession at ${airportName} applies to a valid Blue Badge as described on the airport's official page.`
  });

  steps.push({
    name:
      kind === "exempt"
        ? "Register to claim the exemption"
        : kind === "free-window"
          ? "Use the named car park and validate the badge"
          : "Follow the published concession",
    text: record.blueBadgePolicy
  });

  if (record.paymentDeadline) {
    steps.push({
      name: "If a charge still applies, pay before the deadline",
      text: `Where the concession doesn't cover your stay, ${airportName} lets you pay by ${record.paymentDeadline}${
        record.penaltyPence !== null ? ` — missing it risks a ${formatPence(record.penaltyPence)} penalty` : ""
      }.`
    });
  }

  return steps;
}

/** Data-driven FAQs. Each answer is built only from verified record fields. */
export function buildBlueBadgeFaqs(
  record: DropOffRecord,
  airportName: string
): { question: string; answer: string }[] {
  const faqs: { question: string; answer: string }[] = [];
  const kind = classifyBlueBadge(record.blueBadgePolicy);
  const fee = headlinePence(record);

  faqs.push({
    question: `Is drop-off free for Blue Badge holders at ${airportName}?`,
    answer: record.isFree
      ? `Dropping off at ${airportName} is free for everyone, Blue Badge or not. ${record.blueBadgePolicy}. (Verified ${record.verifiedAt}, per the official ${airportName} page.)`
      : kind === "exempt"
        ? `Yes — Blue Badge holders can drop off free${fee !== null ? ` (the ${formatPence(fee)} charge is waived)` : ""} once the exemption is registered as required. ${record.blueBadgePolicy}. (Verified ${record.verifiedAt}.)`
        : kind === "none"
          ? `No — ${airportName} publishes no Blue Badge concession for the drop-off forecourt. ${record.blueBadgePolicy}. (Verified ${record.verifiedAt}.)`
          : `Not outright — ${airportName} doesn't waive the${fee !== null ? ` ${formatPence(fee)}` : ""} charge, but publishes a concession: ${record.blueBadgePolicy}. (Verified ${record.verifiedAt}.)`
  });

  faqs.push({
    question: `How do Blue Badge holders claim the concession at ${airportName}?`,
    answer: blueBadgeHasProcess(record)
      ? `${record.blueBadgePolicy}. (Verified ${record.verifiedAt}, per the official ${airportName} page.)`
      : `${airportName}'s official page describes no specific process. ${record.blueBadgePolicy}. (Verified ${record.verifiedAt}.)`
  });

  if (record.freeAlternative) {
    faqs.push({
      question: `Is there a free drop-off option at ${airportName} for everyone?`,
      answer: `Yes — the ${record.freeAlternative.name} is free for ${record.freeAlternative.minutesFree} minutes for any driver. ${record.freeAlternative.details} (Verified ${record.verifiedAt}.)`
    });
  }

  if (!record.isFree && record.penaltyPence !== null) {
    faqs.push({
      question: `What if I drop off without using the Blue Badge concession at ${airportName}?`,
      answer: `The standard rules apply: ${record.penaltyNotes ?? `a penalty of ${formatPence(record.penaltyPence)} may be charged for an unpaid visit`}.${
        record.paymentDeadline ? ` Pay by ${record.paymentDeadline}.` : ""
      } (Verified ${record.verifiedAt}.)`
    });
  }

  return faqs;
}

export interface BlueBadgeIndexRow {
  slug: string;
  name: string;
  kind: BlueBadgeKind;
  isFree: boolean;
  feePence: number | null;
  statusLabel: string;
}

/** Answer-first summary for the index/hub page: how many airports waive the charge for Blue Badge
 *  holders, how many publish a concession, and how many publish nothing. Pure + tested — every
 *  count is derived from the classified policies, never asserted beyond the data. */
export function blueBadgeIndexSummary(rows: BlueBadgeIndexRow[]): string {
  if (rows.length === 0) return "We don't yet hold a Blue Badge drop-off policy for any UK airport.";
  const exempt = rows.filter((r) => !r.isFree && r.kind === "exempt").length;
  const free = rows.filter((r) => r.isFree).length;
  const concession = rows.filter((r) => !r.isFree && (r.kind === "free-window" || r.kind === "reduced")).length;
  const none = rows.filter((r) => !r.isFree && r.kind === "none").length;

  const parts: string[] = [];
  if (exempt > 0) parts.push(`${exempt} fully waive the charge for registered Blue Badge holders`);
  if (concession > 0) parts.push(`${concession} offer a free window or reduced concession`);
  if (none > 0) parts.push(`${none} publish no Blue Badge concession`);
  if (free > 0) parts.push(`${free} are free for everyone`);

  return `We hold the Blue Badge drop-off policy for ${rows.length} UK airports, each read from the airport's own page: ${parts.join(", ")}. Outcomes vary airport by airport — check yours below.`;
}

/** Build an index row from a record. Pure. */
export function blueBadgeIndexRow(record: DropOffRecord, name: string): BlueBadgeIndexRow {
  return {
    slug: record.airportSlug,
    name,
    kind: classifyBlueBadge(record.blueBadgePolicy),
    isFree: record.isFree,
    feePence: headlinePence(record),
    statusLabel: blueBadgeStatusLabel(record)
  };
}

/** Sort key so the index leads with the strongest outcomes (exempt → free window → reduced → none),
 *  free-for-all airports sorted in with exempt. Pure. */
export function blueBadgeSortRank(row: BlueBadgeIndexRow): number {
  if (row.isFree) return 0;
  return { exempt: 1, "free-window": 2, reduced: 3, none: 4 }[row.kind];
}

import {
  loadLoungeDataset,
  loadPriorityPass,
  loadAirports,
  type Lounge,
  type LoungeRecord,
  type PriorityPass,
  type Airport,
} from "@mathfamily/data";
import { loungeBreakEven, formatPence, type LoungeBreakEven } from "@mathfamily/engine";

// LoungeMath is an access-RULES + value site, NOT a day-pass reseller. The model
// joins the verified per-airport lounge dataset to the airport metadata and the
// Priority Pass membership tiers, then runs ParkMath's break-even engine so every
// page answers: which lounges, HOW you get in, and whether membership beats
// pay-on-the-door for your travel frequency. Every price is verified + dated; the
// Zod loaders fail the build on any un-sourced value.

export interface AccessMethod {
  /** Short label, e.g. "Pay on the door". */
  label: string;
  /** One-line, verifiable description of the method. */
  detail: string;
}

export interface LoungePageModel {
  airport: Airport;
  record: LoungeRecord;
  lounges: Lounge[];
  /** Lounges with a published walk-in price, cheapest first. */
  pricedLounges: Lounge[];
  /** Cheapest published walk-in price across this airport's lounges, or null. */
  cheapestWalkInPence: number | null;
  /** Lounges with no statically-published price (dynamic / on-request). */
  unpricedLounges: Lounge[];
  /** Whether any lounge here accepts Priority Pass. */
  acceptsPriorityPass: boolean;
  priorityPass: PriorityPass;
  /** Break-even at the default comparison frequency (see DEFAULT_VISITS). */
  breakEven: LoungeBreakEven | null;
  verifiedAt: string;
}

/** Default visit frequency used for the headline break-even on each page. */
export const DEFAULT_VISITS = 6;

function airportBySlug(slug: string, airports: Airport[]): Airport | null {
  return airports.find((a) => a.slug === slug) ?? null;
}

/** Membership tiers shaped for the break-even engine. */
export function priorityPassTiers(pp: PriorityPass) {
  return pp.tiers.map((t) => ({
    tier: t.tier,
    annualFeePence: t.annualFeePence,
    includedVisits: t.includedVisits,
    perVisitPence: t.perVisitPence,
  }));
}

export function buildLoungePageModel(
  slug: string,
  visitsPerYear: number = DEFAULT_VISITS
): LoungePageModel | null {
  const ds = loadLoungeDataset();
  const record = ds.records.find((r) => r.airportSlug === slug);
  if (!record) return null;
  const airport = airportBySlug(slug, loadAirports());
  if (!airport) return null;

  const pp = loadPriorityPass();
  const lounges = record.lounges;
  const pricedLounges = lounges
    .filter((l): l is Lounge & { walkInPence: number } => l.walkInPence !== null)
    .sort((a, b) => a.walkInPence - b.walkInPence);
  const unpricedLounges = lounges.filter((l) => l.walkInPence === null);
  const cheapestWalkInPence = pricedLounges[0]?.walkInPence ?? null;
  const acceptsPriorityPass = lounges.some((l) => l.priorityPass);

  // Break-even only makes sense when there is a comparable walk-in price.
  const breakEven =
    cheapestWalkInPence !== null
      ? loungeBreakEven(cheapestWalkInPence, visitsPerYear, priorityPassTiers(pp))
      : null;

  return {
    airport,
    record,
    lounges,
    pricedLounges,
    cheapestWalkInPence,
    unpricedLounges,
    acceptsPriorityPass,
    priorityPass: pp,
    breakEven,
    verifiedAt: record.verifiedAt,
  };
}

export function allLoungeSlugs(): string[] {
  return loadLoungeDataset().records.map((r) => r.airportSlug);
}

/** Date-stamp shared across hub/sitemap/llms — newest record verification. */
export function latestVerifiedAt(): string {
  const ds = loadLoungeDataset();
  return ds.records.map((r) => r.verifiedAt).sort().at(-1) ?? ds.lastUpdated;
}

/**
 * The access methods available at an airport, derived ONLY from verified facts in
 * the dataset (no fabrication). "Pay on the door" appears when a walk-in price is
 * published; Priority Pass appears when any lounge accepts it.
 */
export function accessMethods(model: LoungePageModel): AccessMethod[] {
  const methods: AccessMethod[] = [];
  if (model.cheapestWalkInPence !== null) {
    methods.push({
      label: "Pay on the door / pre-book",
      detail: `Buy a single visit directly — from ${formatPence(
        model.cheapestWalkInPence
      )} per adult at the cheapest lounge. Pre-booking is usually cheaper than a walk-up and guarantees a slot.`,
    });
  }
  if (model.acceptsPriorityPass) {
    methods.push({
      label: "Priority Pass / lounge membership",
      detail:
        "At least one lounge here accepts Priority Pass (and typically DragonPass / LoungeKey). A membership or eligible premium credit card can get you in without paying the walk-in rate each time.",
    });
  }
  methods.push({
    label: "Credit-card lounge access",
    detail:
      "Several premium UK travel cards bundle Priority Pass or direct lounge access. Check your card's benefits — if it already includes a Priority Pass membership, your per-visit cost may be £0.",
  });
  return methods;
}

/** Verdict sentence for the saves component, from the break-even result. */
export function breakEvenVerdict(model: LoungePageModel): string {
  const be = model.breakEven;
  if (!be || model.cheapestWalkInPence === null) {
    return `${model.airport.name}'s lounge prices are set dynamically — compare the walk-in rate against a Priority Pass membership for your travel frequency.`;
  }
  if (be.verdict === "membership" && be.best) {
    return `At ${be.visitsPerYear} visits a year, Priority Pass ${be.best.tier} (${formatPence(
      be.best.totalPence
    )}/yr) beats paying on the door (${formatPence(
      be.payAsYouGoPence
    )}) — a saving of about ${formatPence(be.savingsPence)}.`;
  }
  return `At ${be.visitsPerYear} visits a year, paying on the door (${formatPence(
    be.payAsYouGoPence
  )}) is cheaper than the best Priority Pass tier — only worth a membership if you fly more often.`;
}

export function buildLoungeFaqs(model: LoungePageModel): { question: string; answer: string }[] {
  const name = model.airport.name;
  const faqs: { question: string; answer: string }[] = [];

  const loungeNames = model.lounges.map((l) => l.name).join(", ");
  faqs.push({
    question: `Which lounges are at ${name} Airport?`,
    answer: `${name} has ${model.lounges.length} listed lounge${
      model.lounges.length === 1 ? "" : "s"
    }: ${loungeNames}. Each is verified against an official source and date-stamped on this page.`,
  });

  if (model.cheapestWalkInPence !== null) {
    faqs.push({
      question: `How much does it cost to get into a lounge at ${name}?`,
      answer: `Published walk-in / pre-book prices at ${name} start from ${formatPence(
        model.cheapestWalkInPence
      )} per adult. Prices are set by the operator and change by date and time — always confirm on the official booking page.`,
    });
  }

  faqs.push({
    question: `Can I use Priority Pass at ${name}?`,
    answer: model.acceptsPriorityPass
      ? `Yes — at least one lounge at ${name} accepts Priority Pass (often subject to pre-booking or capacity). If you fly a few times a year, a membership can work out cheaper than paying per visit.`
      : `Based on the official lounge information we can verify, Priority Pass is not confirmed at ${name}. Check the lounge operator's page before relying on it.`,
  });

  if (model.breakEven) {
    faqs.push({
      question: `Is a Priority Pass membership worth it for ${name}?`,
      answer: breakEvenVerdict(model),
    });
  }

  return faqs;
}

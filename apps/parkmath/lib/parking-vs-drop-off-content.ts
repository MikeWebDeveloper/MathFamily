import { formatPence } from "@mathfamily/engine";
import { isPublicTransportAlt, loadDropOffDataset, loadParkingDataset, type DropOffRecord, type ParkingRecord } from "@mathfamily/data";
import { resolveParkingMerchant } from "./partners";

/** Inputs needed to decide whether an airport can have a "parking vs drop-off" page.
 *  We need BOTH a real drop-off charge (a charging airport with a priced first band) AND
 *  a verified gate parking tariff covering the 7-day reference duration. Either missing → skip. */
export interface ParkingVsDropOffInputs {
  dropOff: DropOffRecord;
  parking: ParkingRecord;
}

/** The reference parking duration the page is built around (the canonical "1 week" trip). */
export const REFERENCE_DAYS = 7;

/** The headline drop-off fee (first/standard band), or null when the airport is free / unbanded.
 *  Never invents a number — returns null and the airport is then excluded. */
export function dropOffFeePence(record: Pick<DropOffRecord, "isFree" | "bands">): number | null {
  if (record.isFree) return null;
  return record.bands[0]?.totalPence ?? null;
}

/** The drive-up GATE parking price for a given duration, or null if not published.
 *  Only the official "gate" (drive-up) product is used — pre-book "from" snapshots are a
 *  different, date-volatile thing and never drive the headline comparison. */
export function gateParkingPence(record: ParkingRecord, days: number): number | null {
  const gate = record.products.find((p) => p.productType === "gate");
  return gate?.prices.find((pr) => pr.days === days)?.totalPence ?? null;
}

/** A pair qualifies only if the airport actually charges to drop off AND publishes a verified
 *  drive-up gate parking price for the reference duration. No fabrication: if either number is
 *  absent from the dataset, the airport is excluded entirely. */
export function qualifiesForParkingVsDropOff(inputs: ParkingVsDropOffInputs): boolean {
  return dropOffFeePence(inputs.dropOff) !== null && gateParkingPence(inputs.parking, REFERENCE_DAYS) !== null;
}

/** Convenience: does this airport slug have a comparable parking-vs-drop-off page? Loads from the
 *  datasets so other routes (e.g. the avoid page) can decide whether to render the cross-link. */
export function airportHasParkingVsDropOff(slug: string): boolean {
  const dropOff = loadDropOffDataset().records.find((r) => r.airportSlug === slug);
  const parking = loadParkingDataset().records.find((r) => r.airportSlug === slug);
  return Boolean(dropOff && parking && qualifiesForParkingVsDropOff({ dropOff, parking }));
}

export interface ParkingVsDropOffModel {
  /** Drop-off forecourt fee (one visit), integer pence. */
  dropOffFeePence: number;
  /** Drive-up gate parking price for the reference duration, integer pence. */
  parkingPence: number;
  /** Days the reference parking price covers. */
  parkingDays: number;
  /** Implied gate price per 24h (parkingPence / parkingDays, integer pence, rounded). */
  perDayPence: number;
  /** Verdict slug: which is the smaller single outlay. A single drop-off is almost always
   *  cheaper than a multi-day park — this is the honest framing, not a "parking wins" spin. */
  cheaperToday: "drop-off" | "parking" | "tie";
  /** How many minutes of drive-up parking cost the same as ONE drop-off (the equivalence hook).
   *  Derived from the per-24h gate rate: minutes = dropOffFee / (perDay / 1440). null if perDay is 0. */
  parkingMinutesPerDropOff: number | null;
  /** How many drop-offs cost the same as the reference parking stay (>= 1 ⇒ many drop-offs per park). */
  dropOffsPerParkingStay: number;
  verifiedAt: string;
}

const MINUTES_PER_DAY = 1440;

/** Build the comparison view-model. Pure; every number traces to a dataset value or an exact
 *  arithmetic combination of dataset values. Callers must pre-check qualifiesForParkingVsDropOff. */
export function parkingVsDropOffModel(inputs: ParkingVsDropOffInputs, days: number = REFERENCE_DAYS): ParkingVsDropOffModel | null {
  const fee = dropOffFeePence(inputs.dropOff);
  const parking = gateParkingPence(inputs.parking, days);
  if (fee === null || parking === null) return null;

  const perDayPence = Math.round(parking / days);
  const parkingMinutesPerDropOff = perDayPence > 0 ? Math.round((fee / perDayPence) * MINUTES_PER_DAY) : null;
  const dropOffsPerParkingStay = fee > 0 ? Math.round(parking / fee) : 0;
  const cheaperToday = fee < parking ? "drop-off" : fee > parking ? "parking" : "tie";

  // The page reports the freshest of the two source verifications, so the badge is honest.
  const verifiedAt = inputs.dropOff.verifiedAt > inputs.parking.verifiedAt ? inputs.dropOff.verifiedAt : inputs.parking.verifiedAt;

  return { dropOffFeePence: fee, parkingPence: parking, parkingDays: days, perDayPence, cheaperToday, parkingMinutesPerDropOff, dropOffsPerParkingStay, verifiedAt };
}

/** The one-line answer that MUST render with JS off. Honest, intent-aware framing: for a quick
 *  drop-off the forecourt fee is the smaller outlay, but if you're parking for the trip anyway
 *  the gate price is what you pay. Every figure comes from the model. */
export function parkingVsDropOffAnswer(model: ParkingVsDropOffModel, airportName: string): string {
  const fee = formatPence(model.dropOffFeePence);
  const park = formatPence(model.parkingPence);
  if (model.cheaperToday === "drop-off") {
    return `If you're only dropping someone off at ${airportName}, the ${fee} forecourt charge is far cheaper than ${park} to park for ${model.parkingDays} days. But if you're parking for the trip anyway, ${park} is the price — and one drop-off (${fee}) buys you about ${model.parkingMinutesPerDropOff} minutes of drive-up parking.`;
  }
  if (model.cheaperToday === "parking") {
    return `Parking at ${airportName} for ${model.parkingDays} days (${park}) costs less than a single ${fee} forecourt drop-off — so even a quick drop-off is no cheaper than parking here.`;
  }
  return `At ${airportName}, ${model.parkingDays}-day drive-up parking (${park}) costs the same as a single ${fee} forecourt drop-off.`;
}

/** Supporting facts for the AnswerLead bullet list — only data-backed lines. */
export function parkingVsDropOffLeadFacts(model: ParkingVsDropOffModel): string[] {
  const facts: string[] = [`Drop-off (one visit): ${formatPence(model.dropOffFeePence)}`, `Drive-up parking (${model.parkingDays} days): ${formatPence(model.parkingPence)}`, `Drive-up gate rate: about ${formatPence(model.perDayPence)} per 24 hours`];
  if (model.parkingMinutesPerDropOff !== null) facts.push(`One drop-off ≈ ${model.parkingMinutesPerDropOff} minutes of drive-up parking`);
  return facts;
}

/** The "X minutes of parking costs the same as one drop-off" equivalence sentence. */
export function parkingEquivalenceLine(model: ParkingVsDropOffModel, airportName: string): string | null {
  if (model.parkingMinutesPerDropOff === null) return null;
  return `At ${airportName}'s drive-up gate rate (${formatPence(model.perDayPence)}/24h), ${model.parkingMinutesPerDropOff} minutes of parking costs the same as one ${formatPence(model.dropOffFeePence)} drop-off.`;
}

/** Data-driven FAQs. Each answer is built only from verified record fields + the model. */
export function buildParkingVsDropOffFaqs(model: ParkingVsDropOffModel, dropOff: DropOffRecord, airportName: string): { question: string; answer: string }[] {
  const fee = formatPence(model.dropOffFeePence);
  const park = formatPence(model.parkingPence);
  const faqs: { question: string; answer: string }[] = [];

  faqs.push({
    question: `Is it cheaper to park or get dropped off at ${airportName}?`,
    answer:
      model.cheaperToday === "drop-off"
        ? `For a quick drop-off, the ${fee} forecourt charge is cheaper than ${park} to park for ${model.parkingDays} days. If you're leaving the car for the trip, ${park} is what drive-up parking costs (verified ${model.verifiedAt}).`
        : model.cheaperToday === "parking"
          ? `${model.parkingDays}-day drive-up parking (${park}) costs less than a single ${fee} drop-off at ${airportName} (verified ${model.verifiedAt}).`
          : `They're level: ${model.parkingDays}-day drive-up parking and a single drop-off both cost ${fee} at ${airportName} (verified ${model.verifiedAt}).`
  });

  if (model.parkingMinutesPerDropOff !== null) {
    faqs.push({
      question: `How much parking do I get for the price of a ${airportName} drop-off?`,
      answer: `At the ${formatPence(model.perDayPence)}-per-24h drive-up gate rate, one ${fee} drop-off buys about ${model.parkingMinutesPerDropOff} minutes of parking at ${airportName}.`
    });
  }

  // Targets the literal "[airport] drop off vs park" / "when is parking cheaper" decision query with
  // the honest both-sides split — the precision the Reddit/MSE incumbents lack. Data-backed only.
  faqs.push({
    question: `${airportName}: drop off vs park — when is each cheaper?`,
    answer:
      `Drop off when you're only running someone to the terminal and leaving: the ${fee} forecourt charge is a one-off and beats paying for parking you won't use. ` +
      `Park when you're flying yourself and the car has to stay — ${model.parkingDays}-day drive-up parking is ${park} (about ${formatPence(model.perDayPence)} per 24h), and a single ${fee} drop-off only covers ${model.parkingMinutesPerDropOff !== null ? `about ${model.parkingMinutesPerDropOff} minutes of it` : "a few minutes of it"}. ` +
      `Pre-booking parking online is usually cheaper than the drive-up gate price. Both figures verified ${model.verifiedAt} against the airport's own pages.`
  });

  const alt = dropOff.freeAlternative;
  if (alt) {
    faqs.push({
      question: `Is there a way to avoid the ${airportName} drop-off charge altogether?`,
      answer: isPublicTransportAlt(alt)
        ? `Yes — arrive by the ${alt.name} instead of using the forecourt. ${alt.details} (Verified ${dropOff.verifiedAt}.)`
        : `Yes — the ${alt.name} gives you ${alt.minutesFree} minutes free. ${alt.details} (Verified ${dropOff.verifiedAt}.)`
    });
  }

  faqs.push({
    question: `Where do these ${airportName} parking and drop-off prices come from?`,
    answer: `The drop-off fee is read from the airport's official drop-off page; the drive-up parking price is the airport's own published gate tariff. Both are date-stamped snapshots, re-verified on the date shown — never scraped from third-party sites.`
  });

  return faqs;
}

/** View-model for the decision bridge shown on a `/drop-off-charges/[airport]` page.
 *  Honest, intent-aware: dropping off is cheapest, but the ~half of readers who WILL park
 *  need an in-flow path to the parking decision. Every number traces to a dataset value.
 *
 *  Three honest tiers, in descending strength:
 *   1. `hasComparison` ⇒ the airport qualifies for a parking-vs-drop-off page (both a real
 *      drop-off fee AND a verified drive-up gate price exist), so the bridge carries the
 *      concrete "park N days = £X" figure and links to that decision page.
 *   2. `hasParking` ⇒ a plain `/airport-parking/[airport]` page exists (a verified parking
 *      tariff, even if not the comparison) — link onward there, no fabricated figure.
 *   3. `affiliateOnly` ⇒ no parking page yet, but the airport DOES charge to drop off (so a
 *      "park or drop off?" decision is live for this audience) AND a verified affiliate parking
 *      deep link resolves for it — so we surface a parking-decision CTA straight to `/go/.../parking`
 *      instead of dead-ending the drop-off audience. No price is shown (we don't have an official
 *      tariff yet), only an honest "compare parking" hand-off. This de-gates the funnel for the
 *      16 airports that pull drop-off traffic but have no parking tariff record.
 *  If none of the three apply (e.g. free drop-off with no parking page and no affiliate link), no bridge. */
export interface DropOffParkingBridge {
  /** Render the bridge at all (true when there is somewhere honest to send a parker). */
  show: boolean;
  /** A parking-vs-drop-off decision page exists for this airport (tier 1). */
  hasComparison: boolean;
  /** A plain airport-parking page exists for this airport (tier 1 or 2). */
  hasParking: boolean;
  /** No parking page, but the airport charges to drop off AND an affiliate parking link resolves —
   *  surface a direct `/go/.../parking` decision CTA rather than dead-ending the audience (tier 3). */
  affiliateOnly: boolean;
  /** Reference parking days the figure covers (only when hasComparison). */
  parkingDays: number;
  /** Drive-up gate parking price for the reference duration, integer pence (only when hasComparison). */
  parkingPence: number | null;
  /** The single drop-off forecourt fee, integer pence (only when hasComparison). */
  dropOffFeePence: number | null;
  /** Verified date of the underlying figures (only when hasComparison). */
  verifiedAt: string | null;
}

/** Build the drop-off → parking decision bridge for an airport slug. Pure over the datasets.
 *  Never fabricates: the comparison figure is only present when both real figures exist; the
 *  bridge degrades to a plain onward link when only a parking page exists, to a direct affiliate
 *  parking CTA when the airport charges to drop off but has no tariff yet (de-gated funnel), and to
 *  nothing when there is no honest path at all. */
export function dropOffParkingBridge(slug: string): DropOffParkingBridge {
  const dropOff = loadDropOffDataset().records.find((r) => r.airportSlug === slug);
  const parking = loadParkingDataset().records.find((r) => r.airportSlug === slug);
  const hasParking = Boolean(parking);
  const hasComparison = Boolean(dropOff && parking && qualifiesForParkingVsDropOff({ dropOff, parking }));

  if (hasComparison && dropOff && parking) {
    const model = parkingVsDropOffModel({ dropOff, parking })!;
    return {
      show: true,
      hasComparison: true,
      hasParking: true,
      affiliateOnly: false,
      parkingDays: model.parkingDays,
      parkingPence: model.parkingPence,
      dropOffFeePence: model.dropOffFeePence,
      verifiedAt: model.verifiedAt
    };
  }

  if (hasParking) {
    // A parking page exists (e.g. a free-drop-off airport with a parking tariff): onward link, no figure.
    return {
      show: true,
      hasComparison: false,
      hasParking: true,
      affiliateOnly: false,
      parkingDays: REFERENCE_DAYS,
      parkingPence: null,
      dropOffFeePence: null,
      verifiedAt: null
    };
  }

  // No parking page. De-gate the funnel: if the airport actually CHARGES to drop off (a live
  // "park or drop off?" decision) AND a verified affiliate parking deep link resolves for it, send
  // the audience straight to the parking comparison via the tracked /go redirect rather than
  // dead-ending. Fail-closed: if no affiliate link resolves (resolveParkingMerchant → null), no bridge.
  const charges = Boolean(dropOff && !dropOff.isFree);
  const affiliateResolves = charges && resolveParkingMerchant(slug, "dropoff-degated") !== null;

  return {
    show: affiliateResolves,
    hasComparison: false,
    hasParking: false,
    affiliateOnly: affiliateResolves,
    parkingDays: REFERENCE_DAYS,
    parkingPence: null,
    dropOffFeePence: null,
    verifiedAt: null
  };
}

export interface ParkingVsDropOffIndexRow {
  slug: string;
  name: string;
  dropOffFeePence: number;
  parkingPence: number;
  parkingDays: number;
  cheaperToday: ParkingVsDropOffModel["cheaperToday"];
}

/** Answer-first summary for the index page: how many airports we can compare and where the
 *  drive-up park is dearest relative to one drop-off. Pure + tested. */
export function parkingVsDropOffIndexSummary(rows: ParkingVsDropOffIndexRow[]): string {
  if (rows.length === 0) return "We don't yet have both a verified drop-off charge and a drive-up parking tariff for any UK airport.";
  const dearest = [...rows].sort((a, b) => b.parkingPence - a.parkingPence)[0]!;
  return `We compare drive-up parking against the forecourt drop-off charge at ${rows.length} UK airports, all from official figures. The steepest drive-up parking is at ${dearest.name}: ${formatPence(dearest.parkingPence)} for ${dearest.parkingDays} days versus a single ${formatPence(dearest.dropOffFeePence)} drop-off.`;
}

import { formatPence } from "@mathfamily/engine";
import { loadDropOffDataset, loadParkingDataset, type DropOffRecord, type ParkingRecord } from "@mathfamily/data";

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

  const alt = dropOff.freeAlternative;
  if (alt) {
    faqs.push({
      question: `Is there a way to avoid the ${airportName} drop-off charge altogether?`,
      answer: `Yes — the ${alt.name} gives you ${alt.minutesFree} minutes free. ${alt.details} (Verified ${dropOff.verifiedAt}.)`
    });
  }

  faqs.push({
    question: `Where do these ${airportName} parking and drop-off prices come from?`,
    answer: `The drop-off fee is read from the airport's official drop-off page; the drive-up parking price is the airport's own published gate tariff. Both are date-stamped snapshots, re-verified on the date shown — never scraped from third-party sites.`
  });

  return faqs;
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

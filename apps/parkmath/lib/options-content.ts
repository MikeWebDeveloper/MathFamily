import { formatPence } from "@mathfamily/engine";
import { isPublicTransportAlt, loadDropOffDataset, loadParkingDataset, type DropOffRecord, type ParkingRecord } from "@mathfamily/data";
import { gateParkingPence, REFERENCE_DAYS } from "./parking-vs-drop-off-content";

/**
 * The booking-intent "airport parking options" decision table — ParkMath's neutral-referee answer
 * to "what's the cheapest way to park/drop at <airport>?". Every priced row is read from the verified
 * dataset (drop-off fee, free alternative, drive-up gate parking); the pre-booked Park & Ride and
 * Meet & Greet rows are intentionally PRICELESS here — their live "from £X" comes from the affiliate
 * feed at render time (fail-closed) and is NEVER fabricated in this static model.
 */

export type OptionRowId = "drop-off" | "free-alternative" | "gate-parking" | "park-and-ride" | "meet-and-greet";

export interface OptionRow {
  id: OptionRowId;
  /** Display name of the option. */
  option: string;
  /** When this option is the right choice (the honest "when it wins" column). */
  whenItWins: string;
  /** Verified cost basis as a display string, or null when the price is affiliate-fed (dormant). */
  costBasis: string | null;
  /** Where the figure comes from: "official" (verified dataset) or "affiliate" (live feed, dormant). */
  source: "official" | "affiliate";
}

/** Pure: build the verified rows of the decision table from the dataset. Affiliate rows
 *  (park-and-ride, meet-and-greet) are appended by the page with a live/fail-closed price — they are
 *  NOT priced here, so this model can never emit a fabricated "from £X". */
export function buildOptionRows(dropOff: DropOffRecord, parking: ParkingRecord | null): OptionRow[] {
  const rows: OptionRow[] = [];

  // 1) Drop-off forecourt — always present (every airport has a drop-off record).
  const fee = dropOff.isFree ? null : dropOff.bands[0]?.totalPence ?? null;
  rows.push({
    id: "drop-off",
    option: "Drop-off forecourt",
    whenItWins: "A quick goodbye — under the included time limit, no luggage faff.",
    costBasis: dropOff.isFree ? "Free" : fee !== null ? `${formatPence(fee)} per drop-off` : null,
    source: "official"
  });

  // 2) Free alternative — only when the dataset carries a verified one.
  if (dropOff.freeAlternative) {
    const alt = dropOff.freeAlternative;
    rows.push({
      id: "free-alternative",
      option: alt.name,
      whenItWins: isPublicTransportAlt(alt)
        ? "No car, or a solo traveller — arrive at the terminal without driving up."
        : "You can spare a few extra minutes' walk or shuttle to skip the fee.",
      costBasis: "Free",
      source: "official"
    });
  }

  // 3) Drive-up gate parking — only when the parking dataset has a verified 7-day gate price.
  if (parking) {
    const gate = gateParkingPence(parking, REFERENCE_DAYS);
    if (gate !== null) {
      rows.push({
        id: "gate-parking",
        option: "Drive-up gate parking",
        whenItWins: "A short trip where you need your car nearby and didn't pre-book.",
        costBasis: `${formatPence(gate)} for ${REFERENCE_DAYS} days at the gate`,
        source: "official"
      });
    }
  }

  // 4) + 5) Pre-booked Park & Ride / Meet & Greet — priceless here, affiliate-fed at render time.
  rows.push({
    id: "park-and-ride",
    option: "Pre-booked Park & Ride",
    whenItWins: "Trips over a day — leave the car off-site and shuttle in.",
    costBasis: null,
    source: "affiliate"
  });
  rows.push({
    id: "meet-and-greet",
    option: "Meet & Greet",
    whenItWins: "Maximum convenience — hand the keys over at the terminal door.",
    costBasis: null,
    source: "affiliate"
  });

  return rows;
}

/** Number-first, verified answer paragraph for the options page (AEO extraction). Leads with the
 *  drop-off fee and the cheapest verified alternative; says nothing about pre-book prices (those are
 *  affiliate-fed and dormant) so the static answer is always honest. Pure + tested. */
export function optionsAnswer(dropOff: DropOffRecord, parking: ParkingRecord | null, airportName: string): string {
  const fee = dropOff.isFree ? null : dropOff.bands[0]?.totalPence ?? null;
  const parts: string[] = [];
  if (dropOff.isFree) {
    parts.push(`Dropping off at ${airportName} is free at the forecourt.`);
  } else if (fee !== null) {
    parts.push(`Dropping off at ${airportName} costs ${formatPence(fee)} at the forecourt.`);
  }
  if (dropOff.freeAlternative) {
    const alt = dropOff.freeAlternative;
    parts.push(
      isPublicTransportAlt(alt)
        ? `The free alternative is to arrive by the ${alt.name}.`
        : `The free alternative is the ${alt.name} (free for ${alt.minutesFree} minutes).`
    );
  }
  if (parking) {
    const gate = gateParkingPence(parking, REFERENCE_DAYS);
    if (gate !== null) parts.push(`Drive-up gate parking is ${formatPence(gate)} for ${REFERENCE_DAYS} days.`);
  }
  parts.push(`For a trip of more than a day, pre-booked Park & Ride or Meet & Greet is usually cheaper than parking at the gate.`);
  parts.push(`Every price here is read from the airport's own published page and date-stamped; we never invent a "from £X".`);
  return parts.join(" ");
}

/** FAQs for the options page — the booking-intent / "cheapest way" questions, answered only from
 *  verified data. No pre-book figure is ever asserted (affiliate-fed, dormant). Pure + tested. */
export function buildOptionsFaqs(
  dropOff: DropOffRecord,
  parking: ParkingRecord | null,
  airportName: string
): { question: string; answer: string }[] {
  const fee = dropOff.isFree ? null : dropOff.bands[0]?.totalPence ?? null;
  const faqs: { question: string; answer: string }[] = [];

  faqs.push({
    question: `What's the cheapest way to park or drop off at ${airportName}?`,
    answer: dropOff.isFree
      ? `Dropping off at ${airportName} is free at the forecourt, so for a quick goodbye that's the cheapest option. For a longer trip, compare drive-up gate parking against a pre-booked Park & Ride. (Verified ${dropOff.verifiedAt}.)`
      : `For a quick drop-off, the ${formatPence(fee ?? 0)} forecourt charge${dropOff.freeAlternative ? ` — or the free ${dropOff.freeAlternative.name}` : ""} is cheapest. For a trip of more than a day, a pre-booked Park & Ride is usually cheaper than parking at the gate. (Verified ${dropOff.verifiedAt}.)`
  });

  faqs.push({
    question: `Is Meet & Greet or Park & Ride better at ${airportName}?`,
    answer: `Park & Ride is the cheaper of the two — you leave the car off-site and take a shuttle. Meet & Greet costs more but is the most convenient: a driver meets you at the terminal and parks the car for you. We show live prices for both when our parking partner has them; we never quote a price we can't verify.`
  });

  if (dropOff.freeAlternative) {
    const alt = dropOff.freeAlternative;
    faqs.push({
      question: `Is there a free option at ${airportName}?`,
      answer: isPublicTransportAlt(alt)
        ? `Yes — arrive by the ${alt.name}, which reaches the terminal without using the paid forecourt. ${alt.details} (Verified ${dropOff.verifiedAt}.)`
        : `Yes — the ${alt.name} is free for ${alt.minutesFree} minutes. ${alt.details} (Verified ${dropOff.verifiedAt}.)`
    });
  }

  return faqs;
}

/** Load the inputs for an airport's options page. Drop-off is required (every airport has one);
 *  parking is optional (used for the gate-parking row when present). */
export function optionsInputs(slug: string): { dropOff: DropOffRecord; parking: ParkingRecord | null } | null {
  const dropOff = loadDropOffDataset().records.find((r) => r.airportSlug === slug);
  if (!dropOff) return null;
  const parking = loadParkingDataset().records.find((r) => r.airportSlug === slug) ?? null;
  return { dropOff, parking };
}

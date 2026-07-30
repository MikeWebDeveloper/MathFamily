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

  // Lead FAQ targets the literal winnable decision query ("is it cheaper to park or get dropped
  // off at X") — the seam where Reddit/MSE/official rank, not the OTA "cheapest parking" fortress.
  faqs.push({
    question: `Is it cheaper to park or get dropped off at ${airportName}?`,
    answer: dropOff.isFree
      ? `For a quick goodbye, dropping off at ${airportName} is free at the forecourt — cheaper than any parking. If the car has to stay for the trip, compare drive-up gate parking against a pre-booked Park & Ride, which is usually cheaper than turning up at the gate. (Verified ${dropOff.verifiedAt}.)`
      : `For a quick drop-off it's almost always cheaper to drop off — the ${formatPence(fee ?? 0)} forecourt charge${dropOff.freeAlternative ? `, or the free ${dropOff.freeAlternative.name},` : ""} beats paying for parking you won't use. If you're flying yourself and the car stays for the trip, parking is what you pay — and pre-booking is usually cheaper than the drive-up gate price. (Verified ${dropOff.verifiedAt}.)`
  });

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

  // Literal-intent-match Q, appended last (2026-07-12 striking-distance pass): GSC data showed this
  // page — not the dedicated /drop-off-charges page — is the one Google already ranks for literal
  // "[airport] drop off charge(s)" queries at several airports (Exeter, Leeds Bradford, Birmingham),
  // yet none of the FAQs above use the word "charge" at all. Answered only from the same verified
  // fee already used elsewhere in this file — never a new/derived figure. Appended, not prepended, so
  // the existing lead-FAQ ordering/tests are untouched.
  faqs.push({
    question: `How much does it cost to drop off at ${airportName}?`,
    answer: dropOff.isFree
      ? `Dropping off at ${airportName} is free at the forecourt — no charge applies. (Verified ${dropOff.verifiedAt}.)`
      : `${airportName}'s drop-off charge is ${formatPence(fee ?? 0)}${dropOff.freeAlternative ? `, or free via the ${dropOff.freeAlternative.name}` : ""}. (Verified ${dropOff.verifiedAt}.)`
  });

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

// ─── Trip-length break-even table (the differentiated, honest wedge) ──────────
// The thing no OTA publishes: a verified, per-airport "which option wins at YOUR trip length",
// built ONLY from figures we actually hold — the free alternative (£0), the forecourt drop-off
// fee, and the airport's own drive-up GATE tariff (with a published pre-book snapshot where one
// exists). It deliberately carries NO fabricated Park & Ride / Meet & Greet number: we hold no
// verified P&R/M&G price, so those stay qualitative (ordering only) and light up with a live
// "from £X" at render time from the affiliate feed (Phase 2). Pure + tested.

const MINUTES_PER_DAY = 1440;

/** The drive-up GATE parking price for a duration, or null if the airport doesn't publish it. */
function gatePence(parking: ParkingRecord, days: number): number | null {
  const gate = parking.products.find((p) => p.productType === "gate");
  return gate?.prices.find((pr) => pr.days === days)?.totalPence ?? null;
}

/** The published pre-book "from" snapshot (a real, dated merchant/airport figure — never invented),
 *  or null when the dataset carries no pre-book product for this airport. Returns the cheapest
 *  per-day rate so it is comparable to the gate per-day rate regardless of the snapshot's duration. */
function prebookPerDayPence(parking: ParkingRecord): { perDayPence: number; days: number; totalPence: number; snapshotDate: string } | null {
  const prebooks = parking.products.filter((p) => p.productType === "prebook");
  let best: { perDayPence: number; days: number; totalPence: number; snapshotDate: string } | null = null;
  for (const p of prebooks) {
    for (const pr of p.prices) {
      if (pr.days <= 0) continue;
      const perDay = Math.round(pr.totalPence / pr.days);
      if (!best || perDay < best.perDayPence) {
        best = { perDayPence: perDay, days: pr.days, totalPence: pr.totalPence, snapshotDate: p.snapshotDate ?? parking.verifiedAt };
      }
    }
  }
  return best;
}

export interface BreakEvenRow {
  /** Stable id for keys/tests. */
  id: "free-alternative" | "drop-off" | "gate-parking" | "pre-book" | "park-ride" | "meet-greet";
  /** The trip / use-case this row wins for. */
  trip: string;
  /** The option name. */
  option: string;
  /** Verified cost string, or null when the figure is affiliate-fed (P&R / M&G — never fabricated). */
  cost: string | null;
  /** Where the figure comes from. "official" rows are the visual anchor; "affiliate" rows are dormant. */
  source: "official" | "affiliate";
}

export interface BreakEvenModel {
  rows: BreakEvenRow[];
  /** The single honest headline: at the verified gate rate, how many drop-offs (or how many days)
   *  before parking is the smarter buy — the crossover the table is built around. */
  headline: string;
  /** True when a real, dated pre-book snapshot anchored the "pre-book beats the gate" row. */
  hasPrebookSnapshot: boolean;
  /** Verified date for the figures used (freshest of the inputs). */
  verifiedAt: string;
}

/** Build the trip-length break-even model from verified data only. Returns null when there is no
 *  gate tariff to anchor a crossover (a free-only / drop-off-only airport has nothing to break
 *  even against). Never invents a Park & Ride or Meet & Greet price. Pure + tested. */
export function buildBreakEvenModel(dropOff: DropOffRecord, parking: ParkingRecord | null, airportName: string): BreakEvenModel | null {
  if (!parking) return null;
  const gate7 = gatePence(parking, 7);
  if (gate7 === null) return null; // no gate anchor → no honest crossover

  const perDayGate = Math.round(gate7 / 7);
  const dropFee = dropOff.isFree ? 0 : dropOff.bands[0]?.totalPence ?? null;
  const prebook = prebookPerDayPence(parking);
  const verifiedAt = parking.verifiedAt > dropOff.verifiedAt ? parking.verifiedAt : dropOff.verifiedAt;

  const rows: BreakEvenRow[] = [];

  // 1) The free alternative — the row no OTA will show you. Always the cheapest where it exists.
  if (dropOff.freeAlternative) {
    const alt = dropOff.freeAlternative;
    rows.push({
      id: "free-alternative",
      trip: isPublicTransportAlt(alt)
        ? "No car, or you can arrive at the terminal without driving up"
        : `A quick goodbye within ${alt.minutesFree} minutes`,
      option: alt.name,
      cost: "Free",
      source: "official"
    });
  }

  // 2) Drop-off forecourt — one visit, when you can't reach the free zone.
  rows.push({
    id: "drop-off",
    trip: "One drop-off, no parking, can't use the free zone",
    option: "Drop-off forecourt",
    cost: dropOff.isFree ? "Free" : dropFee !== null ? `${formatPence(dropFee)} per visit` : null,
    source: "official"
  });

  // 3) Drive-up gate parking — the expensive default when you park without pre-booking.
  rows.push({
    id: "gate-parking",
    trip: "You're parking for the trip but didn't pre-book",
    option: "Drive-up gate parking",
    cost: `${formatPence(gate7)} for 7 days (${formatPence(perDayGate)}/day)`,
    source: "official"
  });

  // 4) Pre-book — verified saving where we hold a dated snapshot; otherwise a priceless (affiliate)
  //    row that lights up with a live "from £X" (never a fabricated figure).
  if (prebook) {
    rows.push({
      id: "pre-book",
      trip: "You're parking for the trip and booked ahead",
      option: "Pre-booked parking",
      cost: `from ${formatPence(prebook.totalPence)} for ${prebook.days} days (${formatPence(prebook.perDayPence)}/day, as of ${prebook.snapshotDate})`,
      source: "official"
    });
  } else {
    rows.push({
      id: "pre-book",
      trip: "You're parking for the trip and booked ahead",
      option: "Pre-booked Park & Ride",
      cost: null,
      source: "affiliate"
    });
  }

  // 5) Meet & Greet — always the most convenient, always priceless here (affiliate-fed at render).
  rows.push({
    id: "meet-greet",
    trip: "Maximum convenience — hand the keys over at the door",
    option: "Meet & Greet",
    cost: null,
    source: "affiliate"
  });

  // The honest headline crossover, built from real figures only.
  let headline: string;
  if (prebook && prebook.perDayPence < perDayGate) {
    const savingPct = Math.round(((perDayGate - prebook.perDayPence) / perDayGate) * 100);
    headline = `Pre-booking parking at ${airportName} costs about ${formatPence(prebook.perDayPence)} a day versus ${formatPence(perDayGate)} a day to turn up at the gate — roughly ${savingPct}% less (pre-book figure as of ${prebook.snapshotDate}). For a quick goodbye, the free ${dropOff.freeAlternative ? dropOff.freeAlternative.name : "drop-off window"} still beats paying anything at all.`;
  } else if (dropFee !== null && dropFee > 0) {
    const dropOffsPerDay = Math.max(1, Math.round(perDayGate / dropFee));
    headline = `At ${airportName}, one day of drive-up parking (${formatPence(perDayGate)}) costs about the same as ${dropOffsPerDay} forecourt drop-off${dropOffsPerDay === 1 ? "" : "s"} (${formatPence(dropFee)} each). If you're only running someone to the terminal, the free ${dropOff.freeAlternative ? dropOff.freeAlternative.name : "drop-off window"} beats both; if the car stays for the trip, pre-booking beats turning up at the gate.`;
  } else {
    headline = `At ${airportName}, drive-up parking is ${formatPence(perDayGate)} a day. For a quick goodbye the free ${dropOff.freeAlternative ? dropOff.freeAlternative.name : "drop-off window"} is cheapest; if the car stays for the trip, pre-booking beats turning up at the gate.`;
  }

  return { rows, headline, hasPrebookSnapshot: Boolean(prebook), verifiedAt };
}

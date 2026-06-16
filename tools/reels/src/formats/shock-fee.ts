import { formatPence } from "@mathfamily/engine";
import type { DropOffRecord, Airport } from "@mathfamily/data";
import type { ReelScript } from "../schema";

/** Eligible = charges a fee, has at least one band, and has a free alternative to point to. */
function isEligible(r: DropOffRecord): boolean {
  return !r.isFree && r.bands.length > 0 && r.freeAlternative !== null;
}

/** Eligible drop-off records (charge a fee + have a free alternative), highest first-band fee first. */
export function eligibleShockFeeRecords(records: DropOffRecord[]): DropOffRecord[] {
  return records.filter(isEligible).sort((a, b) => b.bands[0]!.totalPence - a.bands[0]!.totalPence);
}

/** The biggest first-band fee makes the best "shock". Throws if nothing is eligible. */
export function pickShockFeeRecord(records: DropOffRecord[]): DropOffRecord {
  const eligible = eligibleShockFeeRecords(records);
  if (eligible.length === 0) throw new Error("no eligible drop-off record for a shock-fee reel");
  return eligible[0]!;
}

/** Per-minute rate, the integer pence figure shown on screen (≥1 so we never say "0p"). */
function perMinutePence(totalPence: number, minutes: number): number {
  return Math.max(1, Math.round(totalPence / minutes));
}

/** "£1 a minute" / "about 47p a minute" — the reframe that makes a flat fee feel like a rip-off. */
function perMinutePhrase(totalPence: number, minutes: number): string {
  const per = perMinutePence(totalPence, minutes);
  const rate = per >= 100 ? formatPence(per) : `${per}p`;
  const about = totalPence % minutes === 0 ? "" : "about ";
  return `${about}${rate} a minute`;
}

export function buildShockFeeReel(record: DropOffRecord, airport: Airport): ReelScript {
  const band = record.bands[0]!;
  const alt = record.freeAlternative!;
  const fee = formatPence(band.totalPence);
  const perMin = perMinutePhrase(band.totalPence, band.upToMinutes);
  // Voice = Route A "£1 a minute": shock → the per-minute reframe → the free fix (relief) → CTA.
  const narration =
    `${fee}. Just to stop your car at ${airport.name} — for ${band.upToMinutes} minutes. ` +
    `That's ${perMin} to drop someone off. ` +
    `But ${alt.name} is free for ${alt.minutesFree} minutes — park, walk them in, leave. ` +
    `We check the real price at every UK airport: parkmath.co.uk.`;
  return {
    version: "1",
    brand: "parkmath",
    format: "shock-fee",
    slug: airport.slug,
    figures: [
      { id: "fee", label: `${airport.name} drop-off`, pence: band.totalPence },
      { id: "perMinute", label: "Per minute", pence: perMinutePence(band.totalPence, band.upToMinutes) },
      { id: "freeMinutes", label: `${alt.name} free minutes`, pence: 0 }
    ],
    scenes: [
      { kind: "intro", onScreenText: `Dropping off at ${airport.name}?`, figureIds: [], durationHintMs: 1500 },
      { kind: "stat", onScreenText: `${fee} for ${band.upToMinutes} min`, figureIds: ["fee"], durationHintMs: 2200 },
      { kind: "stat", onScreenText: `That's ${perMin}`, figureIds: ["perMinute"], durationHintMs: 2200 },
      { kind: "alternative", onScreenText: `${alt.name}: free ${alt.minutesFree} min`, figureIds: ["freeMinutes"], durationHintMs: 2500 },
      { kind: "verified", onScreenText: `Verified ${record.verifiedAt}`, figureIds: [], durationHintMs: 1400 },
      { kind: "cta", onScreenText: "Every UK airport · parkmath.co.uk", figureIds: [], durationHintMs: 1600 }
    ],
    narration,
    captions: [
      `${fee} to drop off at ${airport.name}`,
      `That's ${perMin}`,
      `${alt.name}: free for ${alt.minutesFree} min`,
      "Every UK airport → parkmath.co.uk"
    ],
    cta: "We check every UK airport — parkmath.co.uk",
    sourceUrl: record.sourceUrl,
    verifiedAt: record.verifiedAt
  };
}

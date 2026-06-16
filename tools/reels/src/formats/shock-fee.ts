import { formatPence } from "@mathfamily/engine";
import type { DropOffRecord, Airport } from "@mathfamily/data";
import type { ReelScript } from "../schema";

/** Eligible = charges a fee, has at least one band, and has a free alternative to point to. */
function isEligible(r: DropOffRecord): boolean {
  return !r.isFree && r.bands.length > 0 && r.freeAlternative !== null;
}

/** The biggest first-band fee makes the best "shock". Throws if nothing is eligible. */
export function pickShockFeeRecord(records: DropOffRecord[]): DropOffRecord {
  const eligible = records.filter(isEligible);
  if (eligible.length === 0) throw new Error("no eligible drop-off record for a shock-fee reel");
  return eligible.reduce((a, b) => (b.bands[0]!.totalPence > a.bands[0]!.totalPence ? b : a));
}

export function buildShockFeeReel(record: DropOffRecord, airport: Airport): ReelScript {
  const band = record.bands[0]!;
  const alt = record.freeAlternative!;
  const fee = formatPence(band.totalPence);
  const narration =
    `It costs ${fee} just to drop someone off at ${airport.name} — for ${band.upToMinutes} minutes. ` +
    `But ${alt.name} is free for ${alt.minutesFree} minutes. Full list and sources at parkmath.co.uk.`;
  return {
    version: "1",
    brand: "parkmath",
    format: "shock-fee",
    slug: airport.slug,
    figures: [
      { id: "fee", label: `${airport.name} drop-off`, pence: band.totalPence },
      { id: "freeMinutes", label: `${alt.name} free minutes`, pence: 0 }
    ],
    scenes: [
      { kind: "intro", onScreenText: `Dropping off at ${airport.name}?`, figureIds: [], durationHintMs: 1500 },
      { kind: "stat", onScreenText: `${fee} for ${band.upToMinutes} min`, figureIds: ["fee"], durationHintMs: 2500 },
      { kind: "alternative", onScreenText: `${alt.name}: free ${alt.minutesFree} min`, figureIds: ["freeMinutes"], durationHintMs: 2500 },
      { kind: "verified", onScreenText: `Verified ${record.verifiedAt}`, figureIds: [], durationHintMs: 1500 },
      { kind: "cta", onScreenText: "parkmath.co.uk", figureIds: [], durationHintMs: 1500 }
    ],
    narration,
    captions: [
      `${fee} to drop off at ${airport.name}`,
      `(${band.upToMinutes} minutes)`,
      `${alt.name}: free for ${alt.minutesFree} min`,
      "Full list at parkmath.co.uk"
    ],
    cta: "Full list and sources at parkmath.co.uk",
    sourceUrl: record.sourceUrl,
    verifiedAt: record.verifiedAt
  };
}

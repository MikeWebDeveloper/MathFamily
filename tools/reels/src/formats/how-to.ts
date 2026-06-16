import { formatPence } from "@mathfamily/engine";
import type { ParkingRecord, Airport } from "@mathfamily/data";
import type { ReelScript } from "../schema";

function priceFor(record: ParkingRecord, productType: "gate" | "prebook", days: number): number | null {
  const prices = record.products
    .filter((p) => p.productType === productType)
    .flatMap((p) => p.prices)
    .filter((pr) => pr.days === days)
    .map((pr) => pr.totalPence);
  return prices.length ? Math.min(...prices) : null;
}

export function gatePrebookSaving(record: ParkingRecord, days: number): { gatePence: number; prebookPence: number; savingPence: number } | null {
  const gatePence = priceFor(record, "gate", days);
  const prebookPence = priceFor(record, "prebook", days);
  if (gatePence === null || prebookPence === null || gatePence <= prebookPence) return null;
  return { gatePence, prebookPence, savingPence: gatePence - prebookPence };
}

export function buildHowToReel(record: ParkingRecord, airport: Airport, days: number): ReelScript {
  const s = gatePrebookSaving(record, days);
  if (!s) throw new Error(`no gate-vs-prebook saving for ${airport.slug} at ${days} days`);
  const saving = formatPence(s.savingPence);
  const narration =
    `Pre-book ${days}-day parking at ${airport.name} and save ${saving} versus turning up at the gate ` +
    `(${formatPence(s.prebookPence)} instead of ${formatPence(s.gatePence)}). Compare every option at parkmath.co.uk.`;
  return {
    version: "1",
    brand: "parkmath",
    format: "how-to",
    slug: airport.slug,
    figures: [
      { id: "saving", label: `${airport.name} ${days}-day saving`, pence: s.savingPence },
      { id: "gate", label: "At the gate", pence: s.gatePence },
      { id: "prebook", label: "Pre-booked", pence: s.prebookPence }
    ],
    scenes: [
      { kind: "intro", onScreenText: `Parking at ${airport.name}?`, figureIds: [], durationHintMs: 1500 },
      { kind: "stat", onScreenText: `Save ${saving}`, figureIds: ["saving"], durationHintMs: 2500 },
      { kind: "alternative", onScreenText: `${formatPence(s.prebookPence)} pre-book vs ${formatPence(s.gatePence)} gate`, figureIds: ["prebook", "gate"], durationHintMs: 2500 },
      { kind: "verified", onScreenText: `Verified ${record.verifiedAt}`, figureIds: [], durationHintMs: 1500 },
      { kind: "cta", onScreenText: "parkmath.co.uk", figureIds: [], durationHintMs: 1500 }
    ],
    narration,
    captions: [`Save ${saving} on ${days}-day parking at ${airport.name}`, `Pre-book ${formatPence(s.prebookPence)} vs gate ${formatPence(s.gatePence)}`, "Compare at parkmath.co.uk"],
    cta: "Compare every option at parkmath.co.uk",
    sourceUrl: record.sourceUrl,
    verifiedAt: record.verifiedAt
  };
}

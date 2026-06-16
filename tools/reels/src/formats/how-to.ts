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
  const gate = formatPence(s.gatePence);
  const prebook = formatPence(s.prebookPence);
  const saving = formatPence(s.savingPence);
  // Voice = Route C "same tarmac": the gate-price dread → the pre-book reveal → the sticky payoff line → CTA.
  const narration =
    `Park at ${airport.name} without booking and it's ${gate} for ${days} days. ` +
    `Book the same car park online first? ${prebook}. ` +
    `Same tarmac — ${saving} difference. Always pre-book. ` +
    `Compare every option at parkmath.co.uk.`;
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
      { kind: "stat", onScreenText: `${gate} at the barrier`, figureIds: ["gate"], durationHintMs: 2400 },
      { kind: "alternative", onScreenText: `Pre-booked: ${prebook}`, figureIds: ["prebook"], durationHintMs: 2400 },
      { kind: "stat", onScreenText: `Same tarmac. ${saving} difference.`, figureIds: ["saving"], durationHintMs: 2600 },
      { kind: "verified", onScreenText: `Verified ${record.verifiedAt}`, figureIds: [], durationHintMs: 1400 },
      { kind: "cta", onScreenText: "Compare all · parkmath.co.uk", figureIds: [], durationHintMs: 1600 }
    ],
    narration,
    captions: [
      `${airport.name} parking, ${days} days`,
      `At the barrier: ${gate}`,
      `Pre-booked: ${prebook}`,
      `Same tarmac. ${saving} difference.`,
      "Compare at parkmath.co.uk"
    ],
    cta: "Compare every option at parkmath.co.uk",
    sourceUrl: record.sourceUrl,
    verifiedAt: record.verifiedAt
  };
}

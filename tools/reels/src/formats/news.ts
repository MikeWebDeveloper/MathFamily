import type { NewsItem, Airport } from "@mathfamily/data";
import type { ReelScript } from "../schema";

/** News reels need a quantified before→after change to put on screen. */
export function buildNewsReel(item: NewsItem, airport: Airport | null): ReelScript {
  if (!item.change) throw new Error(`news item ${item.id} has no quantified change to show`);
  const where = airport?.name ?? "A UK airport";
  const { label, from, to } = item.change;
  // Voice = Route B "quietly rising": calm authority — the change, the restraint, the sourced proof, CTA.
  const narration =
    `${where}: ${label.toLowerCase()} just went up — from ${from} to ${to}. Quietly. ` +
    `No press release. We caught it in the official pages, with the date. ` +
    `We track every UK airport change: parkmath.co.uk.`;
  return {
    version: "1",
    brand: "parkmath",
    format: "news",
    slug: item.airportSlug ?? item.id,
    figures: [{ id: "change", label, pence: 0 }],
    scenes: [
      { kind: "intro", onScreenText: `${where}: fees just went up`, figureIds: [], durationHintMs: 1800 },
      { kind: "stat", onScreenText: `${from} → ${to}`, figureIds: ["change"], durationHintMs: 2500 },
      { kind: "verified", onScreenText: `Verified ${item.verifiedAt} · ${item.sourceLabel}`, figureIds: [], durationHintMs: 1900 },
      { kind: "cta", onScreenText: "Track every change · parkmath.co.uk", figureIds: [], durationHintMs: 1600 }
    ],
    narration,
    captions: [
      `${where}: fees just went up. Quietly.`,
      `${label}: ${from} → ${to}`,
      `Verified ${item.verifiedAt} · ${item.sourceLabel}`,
      "Track every change → parkmath.co.uk"
    ],
    cta: "Track every UK airport change at parkmath.co.uk",
    sourceUrl: item.sourceUrl,
    verifiedAt: item.verifiedAt
  };
}

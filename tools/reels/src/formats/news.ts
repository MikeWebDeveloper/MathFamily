import type { NewsItem, Airport } from "@mathfamily/data";
import type { ReelScript } from "../schema";

/** News reels need a quantified before→after change to put on screen. */
export function buildNewsReel(item: NewsItem, airport: Airport | null): ReelScript {
  if (!item.change) throw new Error(`news item ${item.id} has no quantified change to show`);
  const where = airport?.name ?? "a UK airport";
  const { label, from, to } = item.change;
  const narration =
    `${where}: ${label.toLowerCase()} just changed from ${from} to ${to}. ` +
    `We verified it against the official source. Track every UK airport at parkmath.co.uk.`;
  return {
    version: "1",
    brand: "parkmath",
    format: "news",
    slug: item.airportSlug ?? item.id,
    figures: [{ id: "change", label, pence: 0 }],
    scenes: [
      { kind: "intro", onScreenText: item.title, figureIds: [], durationHintMs: 1800 },
      { kind: "stat", onScreenText: `${from} → ${to}`, figureIds: ["change"], durationHintMs: 2500 },
      { kind: "verified", onScreenText: `Verified ${item.verifiedAt} · ${item.sourceLabel}`, figureIds: [], durationHintMs: 1800 },
      { kind: "cta", onScreenText: "parkmath.co.uk", figureIds: [], durationHintMs: 1500 }
    ],
    narration,
    captions: [item.title, `${label}: ${from} → ${to}`, `Source: ${item.sourceLabel}`, "Track it at parkmath.co.uk"],
    cta: "Track every UK airport at parkmath.co.uk",
    sourceUrl: item.sourceUrl,
    verifiedAt: item.verifiedAt
  };
}

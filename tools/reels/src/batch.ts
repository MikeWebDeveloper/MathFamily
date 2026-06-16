import { loadAirports, loadDropOffDataset, loadParkingDataset, recentNews } from "@mathfamily/data";
import type { Airport } from "@mathfamily/data";
import { ReelScriptSchema } from "./schema";
import type { ReelScript } from "./schema";
import { eligibleShockFeeRecords, buildShockFeeReel } from "./formats/shock-fee";
import { gatePrebookSaving, buildHowToReel } from "./formats/how-to";
import { buildNewsReel } from "./formats/news";

const bySlug = (airports: Airport[]) => new Map(airports.map((a) => [a.slug, a]));
const DURATIONS = [7, 14, 3];
const DEFAULT_ORDER = ["shock-fee", "how-to", "news"];

/** Produce up to `count` reels, round-robin across formats so the feed stays varied. Skips any slot
 *  with no verified data (never fabricate). `excludeSlugs` (recent ledger slugs) + within-run dedupe
 *  prevent repeats; `preferFormats` (from the loop digest) reorders which format leads. */
export function buildWeeklyBatch(
  count = 5,
  excludeSlugs: Set<string> = new Set(),
  preferFormats: string[] = []
): ReelScript[] {
  const airports = bySlug(loadAirports());
  const usedSlugs = new Set<string>(excludeSlugs);

  // Pre-build every candidate reel per format (cheap, pure builders), best-first within each format.
  const candidates: Record<string, ReelScript[]> = {
    "shock-fee": eligibleShockFeeRecords(loadDropOffDataset().records)
      .map((r) => {
        const a = airports.get(r.airportSlug);
        return a ? buildShockFeeReel(r, a) : null;
      })
      .filter((x): x is ReelScript => x !== null),
    "how-to": loadParkingDataset()
      .records.map((r) => {
        const a = airports.get(r.airportSlug);
        const days = DURATIONS.find((d) => gatePrebookSaving(r, d) !== null);
        return a && days ? buildHowToReel(r, a, days) : null;
      })
      .filter((x): x is ReelScript => x !== null),
    news: recentNews(10)
      .filter((i) => i.change)
      .map((i) => buildNewsReel(i, i.airportSlug ? airports.get(i.airportSlug) ?? null : null))
  };

  const order = [
    ...preferFormats.filter((f) => candidates[f]),
    ...DEFAULT_ORDER.filter((f) => !preferFormats.includes(f))
  ];

  const out: ReelScript[] = [];
  let progressed = true;
  while (out.length < count && progressed) {
    progressed = false;
    for (const f of order) {
      if (out.length >= count) break;
      const list = candidates[f]!;
      while (list.length) {
        const reel = list.shift()!;
        if (usedSlugs.has(reel.slug)) continue;
        out.push(reel);
        usedSlugs.add(reel.slug);
        progressed = true;
        break;
      }
    }
  }
  return out.slice(0, count).map((s) => ReelScriptSchema.parse(s));
}

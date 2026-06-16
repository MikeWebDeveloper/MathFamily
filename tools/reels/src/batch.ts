import { loadAirports, loadDropOffDataset, loadParkingDataset, recentNews } from "@mathfamily/data";
import type { Airport } from "@mathfamily/data";
import { ReelScriptSchema } from "./schema";
import type { ReelScript } from "./schema";
import { pickShockFeeRecord, buildShockFeeReel } from "./formats/shock-fee";
import { gatePrebookSaving, buildHowToReel } from "./formats/how-to";
import { buildNewsReel } from "./formats/news";

const bySlug = (airports: Airport[]) => new Map(airports.map((a) => [a.slug, a]));
const DURATIONS = [7, 14, 3];

/** Produce up to `count` reels rotating shock-fee → how-to → news, skipping any slot that
 *  has no verified data (never fabricate to fill a slot — content-factory hard rule). */
export function buildWeeklyBatch(count = 5): ReelScript[] {
  const airports = bySlug(loadAirports());
  const out: ReelScript[] = [];
  const usedSlugs = new Set<string>();

  // shock-fee: highest fee not already used
  try {
    const recs = loadDropOffDataset().records.filter((r) => !usedSlugs.has(r.airportSlug));
    const rec = pickShockFeeRecord(recs);
    const air = airports.get(rec.airportSlug);
    if (air) { out.push(buildShockFeeReel(rec, air)); usedSlugs.add(rec.airportSlug); }
  } catch { /* no eligible record — skip the slot, never fabricate */ }

  // how-to: first airport+duration with a real saving
  for (const rec of loadParkingDataset().records) {
    if (out.length >= count) break;
    if (usedSlugs.has(rec.airportSlug)) continue;
    const air = airports.get(rec.airportSlug);
    const days = DURATIONS.find((d) => gatePrebookSaving(rec, d) !== null);
    if (air && days) { out.push(buildHowToReel(rec, air, days)); usedSlugs.add(rec.airportSlug); }
  }

  // news: recent items with a quantified change
  for (const item of recentNews(10)) {
    if (out.length >= count) break;
    if (!item.change) continue;
    const air = item.airportSlug ? airports.get(item.airportSlug) ?? null : null;
    out.push(buildNewsReel(item, air));
  }

  return out.slice(0, count).map((s) => ReelScriptSchema.parse(s));
}

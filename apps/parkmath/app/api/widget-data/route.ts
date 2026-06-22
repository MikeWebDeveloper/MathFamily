/**
 * /api/widget-data — JSON feed for the drop-off index widget.
 *
 * Returns a compact, cacheable snapshot the JS sparkline can fetch:
 *   - headline stat (most expensive airport + fee)
 *   - sparkline series (priorYearFee → currentFee for top-10 airports)
 *   - freshness date
 *   - a plaintext summary sentence (also exposed in the HTML fallback below)
 *
 * Static export: the numbers only change when a new dataset ships, so
 * we force-static to get CDN caching with no per-request compute.
 */

import { loadAirports, loadDropOffDataset } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { buildDropOffLeague } from "@/lib/content";

export const dynamic = "force-static";
export const revalidate = 3600; // 1-hour ISR ceiling (Vercel)

export interface WidgetDataPayload {
  /** ISO date of the most-recently verified row. */
  verifiedAt: string;
  /** The headline: "{airportName}: {fee}" e.g. "Heathrow: £7". */
  headlineStat: string;
  /** Airport name only. */
  headlineAirport: string;
  /** Fee in pence for the headline airport. */
  headlineFeePence: number;
  /** Formatted fee string, e.g. "£7.00". */
  headlineFee: string;
  /**
   * Sparkline series: [priorYearFeePence, currentFeePence] for the headline airport.
   * Two points — the real verified trend for 2025→2026.
   * Falls back to [headlineFeePence, headlineFeePence] when no prior-year data.
   */
  sparkline: number[];
  /** Total airports tracked. */
  totalAirports: number;
  /** Total airports that currently charge. */
  chargingAirports: number;
  /** One-line plaintext summary for AEO / plain-text fallback. */
  summary: string;
}

export async function GET() {
  const airports = new Map(loadAirports().map((a) => [a.slug, a]));
  const dataset = loadDropOffDataset();
  const nameFor = (slug: string) => airports.get(slug)?.name ?? slug;

  const league = buildDropOffLeague(dataset.records, nameFor);
  const latestVerified =
    dataset.records.map((r) => r.verifiedAt).sort().at(-1) ?? dataset.lastUpdated;

  // Headline: most expensive by standard headline fee (bands[0])
  const paying = [...dataset.records].filter((r) => !r.isFree);
  const byFee = paying.sort((a, b) => (b.bands[0]?.totalPence ?? 0) - (a.bands[0]?.totalPence ?? 0));
  const top = byFee[0];

  const topEntry = top ? league.find((e) => e.airportSlug === top.airportSlug) : null;
  const headlineFeePence = topEntry?.feePence ?? 0;
  const headlineAirport = topEntry ? nameFor(topEntry.airportSlug) : "Unknown";
  const headlineFee = formatPence(headlineFeePence);

  // Sparkline: real 2025→2026 data for the headline airport
  const priorFee =
    top?.priorYearFeePence !== null && top?.priorYearFeePence !== undefined && top.priorYearFeePence > 0
      ? top.priorYearFeePence
      : headlineFeePence;
  const sparkline = [priorFee, headlineFeePence];

  const chargingCount = league.filter((e) => !e.isFree).length;
  const totalCount = league.length;

  const cheapest = [...league].filter((e) => !e.isFree).sort((a, b) => a.feePence - b.feePence)[0];
  const cheapestStr = cheapest ? ` The cheapest is ${nameFor(cheapest.airportSlug)} at ${formatPence(cheapest.feePence)}.` : "";

  const summary = `Most expensive UK airport drop-off: ${headlineAirport} at ${headlineFee}.${cheapestStr} ${chargingCount} of ${totalCount} major airports charge for drop-off (2026, verified ${latestVerified}).`;

  const payload: WidgetDataPayload = {
    verifiedAt: latestVerified,
    headlineStat: `${headlineAirport}: ${headlineFee}`,
    headlineAirport,
    headlineFeePence,
    headlineFee,
    sparkline,
    totalAirports: totalCount,
    chargingAirports: chargingCount,
    summary
  };

  return new Response(JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

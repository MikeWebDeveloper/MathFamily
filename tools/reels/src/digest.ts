import type { LedgerEntry } from "./ledger";

// Closes the loop: join the ledger (what we generated, with UTM ids) to analytics reach, rank what
// performed, and recommend what to make more of. Pure — fetching lives in ./analytics + digest-cli.

export interface ReachRow {
  key: string; // a utm_campaign (Plausible) OR a landing path (Cloudflare)
  visitors: number;
  outboundClicks?: number;
}

export interface Performer {
  id: string; slug: string; format: string; campaign: string; landingUrl: string;
  visitors: number; outboundClicks: number;
}

export interface DigestResult {
  performers: Performer[];
  boostSlugs: string[];
  boostFormats: string[];
  totalVisitors: number;
  recommendation: string;
}

function pathOf(url: string): string {
  try { return new URL(url).pathname; } catch { return ""; }
}

/** Rank ledger entries by reach (matched on utm_campaign, falling back to landing path), and
 *  recommend the best-performing format + airports to revisit. */
export function buildDigest(ledger: LedgerEntry[], reach: ReachRow[], topN = 5): DigestResult {
  const reachMap = new Map(reach.map((r) => [r.key, r]));
  const performers: Performer[] = ledger
    .map((e) => {
      const r = reachMap.get(e.utmCampaign) ?? reachMap.get(pathOf(e.landingUrl));
      return {
        id: e.id, slug: e.slug, format: e.format, campaign: e.utmCampaign, landingUrl: e.landingUrl,
        visitors: r?.visitors ?? 0, outboundClicks: r?.outboundClicks ?? 0
      };
    })
    .sort((a, b) => b.visitors - a.visitors || b.outboundClicks - a.outboundClicks);

  const totalVisitors = performers.reduce((n, p) => n + p.visitors, 0);
  const boostSlugs = [...new Set(performers.filter((p) => p.visitors > 0).map((p) => p.slug))].slice(0, topN);

  const fmt = new Map<string, number>();
  for (const p of performers) fmt.set(p.format, (fmt.get(p.format) ?? 0) + p.visitors);
  const boostFormats = [...fmt.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([f]) => f);

  const recommendation =
    totalVisitors === 0
      ? "No analytics yet — keep the current rotation; revisit once traffic data lands."
      : `Lead next week with the ${boostFormats[0]} format. Most-visited: ` +
        performers.slice(0, 3).map((p) => `${p.format}:${p.slug} (${p.visitors})`).join(", ") + ".";

  return { performers, boostSlugs, boostFormats, totalVisitors, recommendation };
}

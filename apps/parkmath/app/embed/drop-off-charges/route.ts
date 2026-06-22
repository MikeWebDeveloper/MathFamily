import { loadAirports, loadDropOffDataset } from "@mathfamily/data";
import { buildDropOffLeague } from "@/lib/content";
import { buildEmbedWidgetHtml } from "@/lib/embed";

// The embeddable widget surface (the FULL league table). Serves a fully self-contained HTML document
// (own inline CSS, no site chrome, no external requests) that third-party sites drop in via <iframe>
// — the #1 faceless-friendly link magnet, with an attribution link back to ParkMath baked in. The
// per-airport single-fee variant lives at /embed/drop-off-charges/[airport] (a path, not a query, so
// each variant is its own cacheable static document — a ?query can't vary a force-static route).
//
// Framing is permitted via next.config.ts's /embed/:path* header rule, which OVERRIDES the site-wide
// X-Frame-Options: DENY / frame-ancestors 'none' (a widget that can't be framed can't be embedded).
//
// force-static: the widget is a pure function of the verified dataset, so it can be fully CDN-cached.
export const dynamic = "force-static";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function GET() {
  const airports = new Map(loadAirports().map((a) => [a.slug, a]));
  const dataset = loadDropOffDataset();
  const nameFor = (slug: string) => airports.get(slug)?.name ?? slug;
  const league = buildDropOffLeague(dataset.records, nameFor);
  const latestVerified = dataset.records.map((r) => r.verifiedAt).sort().at(-1) ?? dataset.lastUpdated;
  const html = buildEmbedWidgetHtml({ siteUrl: SITE_URL, league, verifiedAt: latestVerified, theme: "auto" });

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}

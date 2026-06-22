import { loadAirports, loadDropOffDataset } from "@mathfamily/data";
import { buildDropOffLeague } from "@/lib/content";
import { buildEmbedWidgetHtml } from "@/lib/embed";

// Per-airport embeddable widget: a single airport's verified drop-off fee as a self-contained,
// framable HTML card. Path-based (not a ?query) so each airport is its own statically-prerendered,
// CDN-cacheable document — a query param can't vary a force-static route, so we make the airport a
// route segment instead. Framing is permitted via next.config.ts's /embed/:path* header rule.
export const dynamic = "force-static";
export const dynamicParams = false; // unknown slugs → 404, never a runtime render of arbitrary input

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function generateStaticParams() {
  return loadDropOffDataset().records.map((r) => ({ airport: r.airportSlug }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ airport: string }> }) {
  const { airport } = await params;
  const airports = new Map(loadAirports().map((a) => [a.slug, a]));
  const dataset = loadDropOffDataset();

  // Fail closed: a slug not in the dataset is a 404, never a fabricated card.
  if (!dataset.records.some((r) => r.airportSlug === airport)) {
    return new Response("Not found", { status: 404 });
  }

  const nameFor = (slug: string) => airports.get(slug)?.name ?? slug;
  const league = buildDropOffLeague(dataset.records, nameFor);
  const latestVerified = dataset.records.map((r) => r.verifiedAt).sort().at(-1) ?? dataset.lastUpdated;

  const html = buildEmbedWidgetHtml({
    siteUrl: SITE_URL,
    league,
    verifiedAt: latestVerified,
    airportSlug: airport,
    theme: "auto",
  });

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}

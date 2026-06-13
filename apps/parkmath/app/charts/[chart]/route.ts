import { loadAirports, loadParkingDataset } from "@mathfamily/data";
import { parkingChartSvg } from "@/lib/chart-svg";
import { parkingPageModel } from "@/lib/parking-content";

export const dynamic = "force-static";
export const dynamicParams = false;

/** /charts/<slug>.svg — a branded gate-vs-pre-book parking chart per airport, for image-SEO
 *  ("<airport> parking prices" in Google Images) and as a social asset. Only airports with a
 *  real 7-day gate + pre-book comparison get a chart. */
export function generateStaticParams() {
  return loadParkingDataset()
    .records.filter((r) => {
      const m = parkingPageModel(r, 7);
      return m.gate && m.cheapest;
    })
    .map((r) => ({ chart: `${r.airportSlug}.svg` }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ chart: string }> }) {
  const { chart } = await params;
  const slug = chart.replace(/\.svg$/, "");
  const airport = loadAirports().find((a) => a.slug === slug);
  const record = loadParkingDataset().records.find((r) => r.airportSlug === slug);
  if (!airport || !record) return new Response("Not found", { status: 404 });

  const m = parkingPageModel(record, 7);
  if (!m.gate || !m.cheapest) return new Response("No 7-day comparison", { status: 404 });

  const svg = parkingChartSvg({
    airportName: airport.name,
    iata: airport.iata,
    gatePence: m.gate.totalPence,
    prebookPence: m.cheapest.totalPence,
    prebookName: m.cheapest.name,
    verifiedAt: record.verifiedAt
  });

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400"
    }
  });
}

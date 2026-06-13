import { loadAirports, loadParkingDataset } from "@mathfamily/data";
import { toCsv } from "@/lib/csv";

export const dynamic = "force-static";

/** Open data: every UK airport parking product (gate + pre-book) at 3/7/14 days, date-stamped
 *  with its official source — one row per airport × product. */
export function GET() {
  const airports = new Map(loadAirports().map((a) => [a.slug, a]));
  const header = [
    "airport", "iata", "product", "price_3day_gbp", "price_7day_gbp", "price_14day_gbp", "verified_at", "source_url"
  ];
  const rows = loadParkingDataset().records.flatMap((r) => {
    const a = airports.get(r.airportSlug);
    return r.products.map((product) => {
      const at = (days: number) => {
        const found = product.prices.find((x) => x.days === days);
        return found ? (found.totalPence / 100).toFixed(2) : "";
      };
      return [a?.name ?? r.airportSlug, a?.iata ?? "", product.name, at(3), at(7), at(14), r.verifiedAt, r.sourceUrl];
    });
  });

  return new Response(toCsv(header, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="parkmath-parking-tariffs.csv"',
      "Cache-Control": "public, max-age=3600, s-maxage=86400"
    }
  });
}

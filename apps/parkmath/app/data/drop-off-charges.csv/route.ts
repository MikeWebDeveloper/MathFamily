import { loadAirports, loadDropOffDataset } from "@mathfamily/data";
import { toCsv } from "@/lib/csv";

export const dynamic = "force-static";

/** Open data: every UK airport drop-off charge, date-stamped with its official source —
 *  a clean CSV for journalists, researchers and data sites to cite + link. */
export function GET() {
  const airports = new Map(loadAirports().map((a) => [a.slug, a]));
  const header = [
    "airport", "iata", "fee", "max_stay_minutes", "penalty_gbp", "free_alternative", "verified_at", "source_url"
  ];
  const rows = loadDropOffDataset().records.map((r) => {
    const a = airports.get(r.airportSlug);
    return [
      a?.name ?? r.airportSlug,
      a?.iata ?? "",
      r.isFree ? "Free" : r.feeSummary,
      r.maxStayMinutes ?? "",
      r.penaltyPence !== null ? (r.penaltyPence / 100).toFixed(2) : "",
      r.freeAlternative?.name ?? "",
      r.verifiedAt,
      r.sourceUrl
    ];
  });

  return new Response(toCsv(header, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="parkmath-drop-off-charges.csv"',
      "Cache-Control": "public, max-age=3600, s-maxage=86400"
    }
  });
}

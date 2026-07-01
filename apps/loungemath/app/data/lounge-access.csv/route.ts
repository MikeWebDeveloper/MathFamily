import { toCsv } from "@/lib/csv";
import { loadLoungeDataset, loadAirports } from "@mathfamily/data";

export const dynamic = "force-static";

export function GET() {
  const ds = loadLoungeDataset();
  const airports = loadAirports();
  const header = [
    "airport_slug",
    "airport_name",
    "iata",
    "lounge_name",
    "walk_in_gbp",
    "priority_pass",
    "notes",
    "verified_at",
    "source_url",
  ];
  const rows = ds.records.flatMap((r) => {
    const airport = airports.find((a) => a.slug === r.airportSlug);
    return r.lounges.map((l) => [
      r.airportSlug,
      airport?.name ?? r.airportSlug,
      airport?.iata ?? "",
      l.name,
      l.walkInPence === null ? "" : (l.walkInPence / 100).toFixed(2),
      l.priorityPass ? "yes" : "no",
      l.notes ?? "",
      r.verifiedAt,
      r.sourceUrl,
    ]);
  });
  return new Response(toCsv(header, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="loungemath-lounge-access.csv"',
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}

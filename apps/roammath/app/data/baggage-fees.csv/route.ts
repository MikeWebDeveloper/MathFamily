import { toCsv } from "@/lib/csv";
import { baggageCsv } from "@/lib/open-data";
export const dynamic = "force-static";
export function GET() {
  const { header, rows } = baggageCsv();
  return new Response(toCsv(header, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="roammath-baggage-fees.csv"',
      "Cache-Control": "public, max-age=3600, s-maxage=86400"
    }
  });
}

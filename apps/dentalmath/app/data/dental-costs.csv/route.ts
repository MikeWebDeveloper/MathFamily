import { toCsv } from "@/lib/csv";
import { TREATMENTS } from "@/lib/dental-data";
import { compareTreatment } from "@/lib/dental-content";

export const dynamic = "force-static";

export function GET() {
  const header = [
    "treatment",
    "nhs_band",
    "nhs_charge_pence_england",
    "private_min_pence",
    "private_max_pence",
    "nhs_source_url",
    "private_source_url",
    "verified_at"
  ];
  const rows = TREATMENTS.map((t) => {
    const c = compareTreatment(t);
    return [
      t.name,
      c.band.label,
      c.nhsPence,
      t.privatePrice.minPence,
      t.privatePrice.maxPence,
      "https://www.nhs.uk/nhs-services/dentists/dental-costs/how-much-will-i-pay-for-nhs-dental-treatment/",
      t.privateSource.sourceUrl,
      t.privateSource.verifiedAt
    ];
  });
  return new Response(toCsv(header, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="dentalmath-dental-costs.csv"',
      "Cache-Control": "public, max-age=3600, s-maxage=86400"
    }
  });
}

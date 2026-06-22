import { PET_COST_RECORDS } from "@/lib/pet-costs";

export const dynamic = "force-static";

function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function GET() {
  const header = [
    "slug",
    "name",
    "species",
    "monthly_care_gbp",
    "setup_gbp",
    "lifetime_min_gbp",
    "lifetime_max_gbp",
    "lifespan_low_years",
    "lifespan_high_years",
    "source_url",
    "verified_at"
  ];
  const lines = PET_COST_RECORDS.map((r) =>
    [
      r.slug,
      r.name,
      r.species,
      (r.monthlyCarePence / 100).toFixed(2),
      (r.setupPence / 100).toFixed(2),
      (r.lifetimeMinPence / 100).toFixed(2),
      (r.lifetimeMaxPence / 100).toFixed(2),
      r.lifespanYears.low,
      r.lifespanYears.high,
      r.sourceUrl,
      r.verifiedAt
    ]
      .map(csvCell)
      .join(",")
  );
  const body = [header.join(","), ...lines].join("\n") + "\n";
  return new Response(body, { headers: { "Content-Type": "text/csv; charset=utf-8" } });
}

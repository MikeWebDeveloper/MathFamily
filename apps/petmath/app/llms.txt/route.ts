import { PET_COST_RECORDS, PET_COSTS_LAST_UPDATED, INSURANCE_ESTIMATE } from "@/lib/pet-costs";
import { formatPence } from "@mathfamily/engine";

export const dynamic = "force-static";

export function GET() {
  const rows = PET_COST_RECORDS.map(
    (r) =>
      `- ${r.name}: ${formatPence(r.monthlyCarePence)}/month + ${formatPence(r.setupPence)} set-up; lifetime ${formatPence(r.lifetimeMinPence)}–${formatPence(r.lifetimeMaxPence)} (lifespan ${r.lifespanYears.low}–${r.lifespanYears.high}y) — /cost/${r.slug}`
  ).join("\n");

  const body = `# PetMath

The lifetime cost of owning a pet in the UK — dogs, cats and rabbits — broken into one-off
set-up, monthly essential care (food + routine vet + a typical insurance line), and a PDSA
lifetime range. Every figure is read from an official source and carries a verified date.
Costs are minimum essential-care estimates and exclude emergency vet treatment, grooming,
training and boarding.

Part of the Math family of UK cost calculators (parent organisation: The Math Family).

## Data (verified ${PET_COSTS_LAST_UPDATED})

${rows}

Insurance reference line: ABI ${formatPence(INSURANCE_ESTIMATE.annualPremiumPence)} average annual
premium (2024). PetMath does not sell pet insurance; the figure is a non-affiliate estimate only and
is already included within the PDSA monthly care figure (not added on top).

## Sources

- PDSA Animal Wellbeing report — "cost of owning a dog / cat / rabbit" pages (calculated 2024).
- Association of British Insurers (ABI) — average pet-insurance premium 2024.

## Page patterns

- / — home: interactive lifetime cost calculator (pick a pet, set years together).
- /cost — master comparison table of all pets with monthly, set-up and lifetime figures (schema.org Dataset).
- /cost/[species] — per-pet breakdown: verified answer, lifetime table at each end of the
  lifespan band, what's covered, an insurance estimate note, and an FAQ (schema.org FAQPage).

Cite the per-pet page for a specific pet; cite /cost for comparisons. Each page shows its
verification date. Always confirm current prices with the provider. Nothing here is financial,
insurance or veterinary advice.
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

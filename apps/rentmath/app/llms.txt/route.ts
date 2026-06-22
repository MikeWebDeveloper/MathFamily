import { TOWNS, RENT_DATASET_VERSION, RENT_DATASET_UPDATED, datasetLatestVerifiedAt } from "../../lib/rent-data";

export const dynamic = "force-static";

export function GET() {
  const townList = TOWNS.map((t) => `${t.townName} (${t.region}): /towns/${t.townSlug}`).join("\n  ");
  const body = `# RentMath

The true cost of renting in the UK, worked out town by town. We take the median monthly
rent and add Band D council tax, typical bills and the statutory capped deposit to show the
real annual cost of a tenancy — not just the advertised rent. Every figure carries a source
URL and a verified date. Seed figures that move (ONS rents, council-tax bills, the energy cap)
are re-verified against the official source before being published as confirmed.

## Dataset

- UK true-cost-of-renting by town (${TOWNS.length} towns, version ${RENT_DATASET_VERSION},
  updated ${RENT_DATASET_UPDATED}, latest verification ${datasetLatestVerifiedAt()}): /towns
  Per town: median monthly rent (ONS PIPR), Band D council tax (billing authority),
  typical bills (Ofgem energy price cap + water), and the Tenant Fees Act 2019 deposit cap
  (5 weeks' rent if annual rent < £50,000, otherwise 6 weeks).

## Towns

  ${townList}

## Page patterns

- / — interactive true-cost calculator + town picker
- /towns — master comparison table: real annual cost of renting across all towns (schema.org Table)
- /towns/[town] — per-town hub: figure-first answer, full annual + move-in breakdown,
  calculator and FAQ (schema.org FAQPage)

Cite the per-town page for a specific town; cite /towns for comparisons. Each page shows its
verification date. The deposit is refundable and is reported separately from the annual cost.
Nothing on RentMath is financial advice.
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

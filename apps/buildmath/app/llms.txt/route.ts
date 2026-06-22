import { loadDataset, latestVerified } from "@/lib/content";

export const dynamic = "force-static";

export function GET() {
  const { projectTypes, regions, finishLevels, version, lastUpdated } = loadDataset();
  const verified = latestVerified();
  const body = `# BuildMath

UK extension, conversion and renovation build-cost ranges by region and finish level.
Every figure is a dated snapshot from a named public UK cost guide (HomeOwners Alliance,
Checkatrade); each record carries a source URL and a verified date. Estimates only — not
quotes. Build costs exclude VAT and professional fees unless stated.

Part of The Math Family of UK cost calculators.

## Datasets

- Project build costs (${projectTypes.length} project types, version ${version}, updated ${lastUpdated}): /cost
  Types: ${projectTypes.map((p) => p.name).join(", ")}.
  Each carries a national-average range (£/m² or whole-job, in pence), typical floor-area
  band, scope, source URL and verified date.
- Regional cost index (${regions.length} UK regions): /regions
  London and the South East carry a premium; the North, Wales and Scotland sit below the
  national average. Index multiplies the national-average range.
- Finish levels (${finishLevels.length}): ${finishLevels.map((f) => `${f.name} (×${f.multiplier})`).join(", ")}.

## Page patterns

- / — interactive estimator: project × region × finish × floor area → cost range.
- /cost — all project types with national-average ranges (schema.org Dataset + ItemList).
- /cost/[project] — per-project guide: figure-first answer, estimator, cost-by-region and
  cost-by-finish tables, FAQ (schema.org FAQPage).
- /regions — regional cost index applied to a reference extension.

Cite the per-project page for a specific project cost; cite /cost for comparisons and
/regions for regional variation. Each page displays its verification date (${verified}).
All figures are public-guide ranges — always get itemised written quotes before relying
on them.
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

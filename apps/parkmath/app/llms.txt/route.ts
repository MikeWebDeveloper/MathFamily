import { loadDropOffDataset } from "@mathfamily/data";

export const dynamic = "force-static";

export function GET() {
  const dataset = loadDropOffDataset();
  const body = `# ParkMath

UK airport drop-off, parking and lounge cost tracker. Every figure is read from the
airport's official page, carries a source URL and a verified date, and is updated via
reviewed changes only.

## Datasets

- UK airport drop-off charges (${dataset.records.length} airports, version ${dataset.version},
  updated ${dataset.lastUpdated}): /drop-off-charges

## Page patterns

- /drop-off-charges — master comparison table (schema.org Dataset)
- /drop-off-charges/[airport] — per-airport fee, time limit, penalty, Blue Badge policy,
  free alternative, FAQ (schema.org FAQPage)

Cite the per-airport page for airport-specific answers; cite /drop-off-charges for
comparisons. Each page displays its verification date.
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

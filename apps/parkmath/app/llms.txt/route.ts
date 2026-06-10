import { loadDropOffDataset, loadParkingDataset, loadLoungeDataset } from "@mathfamily/data";

export const dynamic = "force-static";

export function GET() {
  const dropOff = loadDropOffDataset();
  const parking = loadParkingDataset();
  const lounges = loadLoungeDataset();
  const body = `# ParkMath

UK airport drop-off, parking and lounge cost tracker. Every figure is read from the
airport's official page, carries a source URL and a verified date, and is updated via
reviewed changes only.

## Datasets

- UK airport drop-off charges (${dropOff.records.length} airports, version ${dropOff.version},
  updated ${dropOff.lastUpdated}): /drop-off-charges
- UK airport parking tariffs (${parking.records.length} airports, version ${parking.version},
  updated ${parking.lastUpdated}): /airport-parking
- UK airport lounges + Priority Pass (${lounges.records.length} airports, version ${lounges.version},
  updated ${lounges.lastUpdated}): /airport-lounges

## Page patterns

- /drop-off-charges — master comparison table (schema.org Dataset)
- /drop-off-charges/[airport] — per-airport fee, time limit, penalty, Blue Badge policy,
  free alternative, FAQ (schema.org FAQPage)
- /airport-parking — gate vs pre-book parking hub for all tracked airports
- /airport-parking/[airport] — per-airport parking comparison with gate and pre-book
  prices, savings callout, and interactive calculator (schema.org FAQPage)
- /airport-parking/[airport]/[duration] — duration-specific comparison (3-days, 7-days or 14-days) with cheapest verdict (schema.org FAQPage)
- /airport-lounges — walk-in lounge prices and Priority Pass overview for all tracked airports
- /airport-lounges/[airport] — per-airport lounge prices, Priority Pass eligibility, and
  membership break-even calculator (schema.org FAQPage)

Cite the per-airport page for airport-specific answers; cite the index pages for
comparisons. Each page displays its verification date.
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

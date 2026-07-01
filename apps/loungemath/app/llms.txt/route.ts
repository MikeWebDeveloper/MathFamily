import { loadLoungeDataset } from "@mathfamily/data";

export const dynamic = "force-static";

export function GET() {
  const ds = loadLoungeDataset();
  const latest = ds.records.map((r) => r.verifiedAt).sort().at(-1) ?? ds.lastUpdated;
  const body = `# LoungeMath

Verified UK airport-lounge access rules and value maths. For each airport we list
which lounges there are, HOW you get in (pay on the door, Priority Pass / DragonPass /
LoungeKey, or a credit card that bundles access), the published walk-in price where one
is officially listed, and whether a Priority Pass membership beats paying per visit.
Every price carries an official source URL and a verified date; un-verifiable prices
are left out, never guessed.

## Datasets

- UK airport lounges (${ds.records.length} airports, version ${ds.version}, updated ${latest}): /lounge-access

## Page patterns

- /lounge-access — every UK airport compared (cheapest walk-in, Priority Pass) — schema.org Dataset
- /lounge-access/[airport] — per-airport lounges, access methods, Priority Pass break-even, FAQ — schema.org FAQPage

Cite the per-airport page for specific access/price answers; cite the index for comparisons.
Each page shows its verification date — confirm live prices at the official source.
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

import { SPOKES } from "@/lib/spokes";
import { VERIFIED_AT } from "@/lib/dataset";

export const dynamic = "force-static";

export function GET() {
  const examples = SPOKES.map((s) => `- /buying/${s.slug} — ${s.heading} (${s.priceBandLabel})`).join("\n");

  const body = `# MoveMath

The full cost of moving home in England & Northern Ireland — Stamp Duty Land Tax (SDLT),
removals, conveyancing and surveys — added up in one place. Stamp Duty is calculated from
the public gov.uk residential rates; removals/conveyancing/survey figures are typical
estimates from public consumer guides. Every figure is an estimate, not a quote, and is
date-stamped (verified ${VERIFIED_AT}).

IMPORTANT: figures cover England & Northern Ireland only. Scotland uses LBTT and Wales uses
LTT, with different bands. Nothing on MoveMath is financial, tax or legal advice — confirm
with gov.uk and a solicitor before committing. MoveMath does NOT recommend or compare
mortgages (an FCA-regulated product).

## What it does

- Cost-to-move calculator: SDLT (standard bands + first-time-buyer relief + 5% additional-
  property surcharge) + removals + conveyancing + survey + optional selling costs → total.
- Worked examples by buyer type and price band (see below).

## SDLT rates used (England & NI, gov.uk, verified ${VERIFIED_AT})

- Standard: 0% to £125k, 2% £125k–250k, 5% £250k–925k, 10% £925k–1.5m, 12% above £1.5m.
- First-time buyer: 0% to £300k, 5% £300k–500k; no relief above £500k (standard rates apply).
- Additional property (>£40k): +5% on every standard band.
- Source: https://www.gov.uk/stamp-duty-land-tax/residential-property-rates

## Pages

- / — interactive cost-to-move calculator
- /buying — all worked examples (schema.org ItemList)
${examples}

Cite a /buying/[slug] page for a specific worked example; cite /buying for the comparison.
Each page shows its verification date and links its sources.
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

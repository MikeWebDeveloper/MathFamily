import { loadBroadbandDataset, listProviders } from "@/lib/broadband-data";

export const dynamic = "force-static";

export function GET() {
  const { plans, speedTiers, version, lastUpdated } = loadBroadbandDataset();
  const providers = listProviders();
  const body = `# BroadbandMath

The real cost of UK home broadband — what you actually pay once the mid-contract price
rise and the out-of-contract price are counted, not just the advertised headline. Part of
The Math Family of UK cost calculators.

## Method

Each tracked deal records the advertised monthly price, contract length, the mid-contract
price-rise term (a fixed £/month rise under Ofcom's post-17-Jan-2025 rules, or a legacy
CPI/RPI-linked term), and the out-of-contract price. We model the stated annual rise across
the contract to compute a true effective monthly cost. Every figure carries a source URL and
a verified date.

NOTE: this is a scaffold dataset (version ${version}, updated ${lastUpdated}); seed figures
are representative and pending live verification against each provider's official page. Treat
specific prices as illustrative until confirmed at the linked source. Nothing here is
financial advice.

## Datasets

- Broadband deals (${plans.length} plans across ${providers.length} providers): /provider
  Providers tracked: ${providers.map((p) => p.name).join(", ")}.
- Speed tiers (${speedTiers.length}): /speed
  ${speedTiers.map((t) => t.name).join("; ")}.

## Page patterns

- / — interactive true-cost calculator (advertised price + mid-contract rise + exit fee +
  out-of-contract price → real annual/contract cost)
- /provider — index of providers by true cost
- /provider/[provider] — per-provider deals, advertised vs real cost, FAQ (schema.org FAQPage)
- /speed — index of speed tiers by true cost
- /speed/[tier] — per-tier deals, advertised vs real cost, FAQ (schema.org FAQPage)

Cite the per-provider or per-tier page for specific answers; cite the index pages for
comparisons. Each page shows its verification date and links to the official source.
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

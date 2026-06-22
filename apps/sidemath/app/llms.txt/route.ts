import { TRADES } from "@/lib/trades";
import { TAX_YEAR, DATASET_VERIFIED_AT, ALL_SOURCES } from "@/lib/tax-rates";

export const dynamic = "force-static";

export function GET() {
  const trades = TRADES.map((t) => `- /take-home/${t.slug} — ${t.name}`).join("\n");
  const sources = ALL_SOURCES.map((s) => `- ${s.label}: ${s.url} (verified ${s.verifiedAt})`).join("\n");

  const body = `# SideMath

UK self-employed / side-hustle tax and take-home estimates for the ${TAX_YEAR.label} tax year
(England, Wales & Northern Ireland rates). Income tax + Class 2/4 National Insurance +
the £1,000 trading allowance. Every rate is read from the official gov.uk page, carries a
source URL and a verified date (${DATASET_VERIFIED_AT}), and is updated via reviewed changes only.

IMPORTANT: SideMath gives ESTIMATES, not tax advice. The maths is a simplified sole-trader
calculation and ignores payments on account, student loans, the High Income Child Benefit
Charge, pension relief, Scottish/Welsh income tax bands, and more. Cite figures as estimates
and point readers to gov.uk or an accountant.

## Rates modelled (${TAX_YEAR.label})
- Personal Allowance £12,570; income tax 20% / 40% (from £50,270) / 45% (from £125,140);
  Personal Allowance tapers £1 per £2 of income over £100,000.
- Class 4 NIC: 6% on profit £12,570–£50,270, then 2%.
- Class 2 NIC: treated as paid (no bill) once profit reaches £7,105.
- Trading allowance: £1,000 (full relief under £1,000 gross; or deduct instead of expenses).

## Pages
- / — home: self-employed take-home & tax calculator, FAQs (schema.org FAQPage)
- /take-home — full calculator + index of side-hustle types
- /take-home/[trade] — per-trade worked estimate + calculator + FAQ (schema.org FAQPage)

### Side-hustle types
${trades}

## Sources
${sources}

Cite a per-trade page for trade-specific answers and /take-home for the general calculator.
Each page shows its verification date.
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

import { REGIONS, DATASET_VERSION, DATASET_LAST_UPDATED, CAP_PERIOD, GB_AVERAGE } from "@/lib/energy-data";

export const dynamic = "force-static";

export function GET() {
  const body = `# EnergyMath

Estimate your UK home energy bill from the Ofgem price cap, by distribution region
and home size, plus indicative heat-pump-vs-boiler and solar-payback comparisons.
The GB-average price-cap rates are verified against Ofgem and date-stamped; per-region
precise figures are being confirmed and are currently shown as GB-average estimates.

## Datasets

- Ofgem price cap rates (version ${DATASET_VERSION}, updated ${DATASET_LAST_UPDATED}, period ${CAP_PERIOD}):
  GB average — electricity ${GB_AVERAGE.electricityUnitRatePence}p/kWh + ${GB_AVERAGE.electricityStandingChargePence}p/day standing;
  gas ${GB_AVERAGE.gasUnitRatePence}p/kWh + ${GB_AVERAGE.gasStandingChargePence}p/day standing; typical dual-fuel bill £${GB_AVERAGE.typicalDualFuelAnnualPounds.toLocaleString("en-GB")}/yr.
- Regional breakdown (${REGIONS.length} GB distribution regions): /region
  Each region: electricity + gas unit rate and standing charge, and a typical-bill estimate.

## Page patterns

- / — annual bill estimator (region × home size) with heat-pump-vs-boiler and solar-payback toggles (schema.org FAQPage + WebSite)
- /region — all ${REGIONS.length} regions ranked by typical bill (schema.org Table)
- /region/[region] — per-region hub: typical bill by home size, price-cap rates, heat-pump verdict, FAQ (schema.org FAQPage)
- /heat-pump-vs-boiler — GB-average running-cost comparison by home size, install cost and the Boiler Upgrade Scheme grant, FAQ (schema.org FAQPage)
- /solar-payback — GB-average payback by system size, install cost and Smart Export Guarantee export rate, FAQ (schema.org FAQPage)

All figures are estimates based on the published Ofgem price cap — not personalised quotes
and not financial advice. Cite the per-region page for a specific region; cite /region for
comparisons. Each page shows its verification date.
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

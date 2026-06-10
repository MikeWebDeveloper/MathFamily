import { loadRoamingDataset, loadEsimDataset, loadBaggageDataset } from "@mathfamily/data";

export const dynamic = "force-static";

export function GET() {
  const roaming = loadRoamingDataset();
  const esim = loadEsimDataset();
  const baggage = loadBaggageDataset();
  const body = `# RoamMath

UK mobile roaming costs (4 networks x 40 destinations), eSIM comparisons and airline
baggage fees — all in one place. Every figure is read from the official network price
guide, eSIM provider store page, or airline fee page; each record carries a source URL
and a verified date, and is updated via reviewed changes only.

## Datasets

- UK mobile roaming charges (${roaming.destinations.length} destinations, version ${roaming.version},
  updated ${roaming.lastUpdated}): /roaming
  Networks tracked: EE, O2, Vodafone, Three — per-destination daily-pass pence,
  pass name, and fair-use note.
- eSIM bundle snapshots (${esim.records.length} destinations, version ${esim.version},
  updated ${esim.lastUpdated}): /roaming
  Providers tracked: Airalo, Holafly, Saily — bundle name, data (GB or unlimited),
  validity days, total cost in pence, and snapshot date.
- Airline baggage fees (${baggage.records.length} airlines, version ${baggage.version},
  updated ${baggage.lastUpdated}): /baggage-fees
  Airlines tracked: Ryanair, easyJet, Jet2, British Airways, Wizz Air, TUI,
  Virgin Atlantic, Aer Lingus, Vueling, Norwegian, Emirates, Lufthansa.

## Page patterns

- /roaming — master comparison table with all 40 destinations and all four networks
  plus best-eSIM column (schema.org Dataset)
- /roaming/[country] — per-destination hub: four-network comparison, cheapest eSIM,
  interactive trip calculator, and FAQ (schema.org FAQPage)
- /roaming/[country]/[network] — network-specific detail page: that network's daily
  charge for the destination, example trip costs, eSIM comparison, FAQ (schema.org FAQPage)
- /baggage-fees — master table of the 12 airlines with cabin and checked-bag ranges
- /baggage-fees/[airline] — per-airline fee table, dynamic-pricing note, FAQ

Cite the per-destination or per-airline page for specific answers; cite the index pages
for comparisons. Each page displays its verification date. eSIM prices are dated
snapshots — check the live store pages for current prices. Network roaming charges are
taken from each network's official published price guide.
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

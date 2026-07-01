import { loadLoungeDataset, loadAirports, loadPriorityPass } from "@mathfamily/data";
import { defaultResolve, type AgentFeedItem, type DatasetAdapter } from "@mathfamily/agent-feed";

// LoungeMath agent feed: one item per UK airport, mapping the verified lounge
// dataset into the generic feed shape. `valuePence` is the cheapest published
// walk-in price (the comparable number agents sort on); the full lounge list,
// access methods and Priority Pass tiers ride along in `fields`. Loading goes
// through the Zod-validated loaders, so provenance is guaranteed (fail-closed).
export function loungeAccessAdapter(): DatasetAdapter {
  const ds = loadLoungeDataset();
  const airports = loadAirports();
  const pp = loadPriorityPass();

  const items: AgentFeedItem[] = ds.records.map((r) => {
    const airport = airports.find((a) => a.slug === r.airportSlug);
    const priced = r.lounges
      .map((l) => l.walkInPence)
      .filter((p): p is number => p !== null)
      .sort((a, b) => a - b);
    const cheapest = priced[0] ?? null;
    const acceptsPriorityPass = r.lounges.some((l) => l.priorityPass);
    return {
      key: r.airportSlug,
      name: airport ? `${airport.name} airport lounges` : r.airportSlug,
      code: airport?.iata ?? null,
      valuePence: cheapest,
      summary: `${airport?.name ?? r.airportSlug} has ${r.lounges.length} lounge(s)${
        cheapest !== null ? `, cheapest walk-in from ${(cheapest / 100).toFixed(2)} GBP` : " (prices set dynamically)"
      }${acceptsPriorityPass ? "; Priority Pass accepted" : "; Priority Pass not confirmed"}.`,
      verifiedAt: r.verifiedAt,
      sourceUrl: r.sourceUrl,
      fields: {
        airportSlug: r.airportSlug,
        iata: airport?.iata ?? null,
        loungeCount: r.lounges.length,
        cheapestWalkInPence: cheapest,
        acceptsPriorityPass,
        lounges: r.lounges,
        priorityPassTiers: pp.tiers,
        priorityPassSource: { sourceUrl: pp.sourceUrl, verifiedAt: pp.verifiedAt },
      },
    };
  });

  return {
    datasetId: "loungemath/lounge-access",
    version: ds.version,
    lastUpdated: ds.lastUpdated,
    publisher: "LoungeMath",
    itemNoun: "airport",
    items: () => items,
    resolve: (q) => defaultResolve(items, q),
  };
}

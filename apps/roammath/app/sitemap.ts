import type { MetadataRoute } from "next";
import { loadRoamingDataset, loadEsimDataset, loadBaggageDataset, NETWORKS } from "@mathfamily/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";

  const roamingDataset = loadRoamingDataset();
  const baggageDataset = loadBaggageDataset();

  const destinations = roamingDataset.destinations;
  const networkSourcesByNetwork = new Map(roamingDataset.networkSources.map((s) => [s.network, s]));

  const latestRoaming = roamingDataset.networkSources.map((s) => s.verifiedAt).sort().at(-1);
  const latestRoamingModified = latestRoaming ? new Date(`${latestRoaming}T00:00:00Z`) : undefined;

  const latestBaggage = baggageDataset.records.map((r) => r.verifiedAt).sort().at(-1);
  const latestBaggageModified = latestBaggage ? new Date(`${latestBaggage}T00:00:00Z`) : undefined;

  return [
    { url: base, changeFrequency: "weekly" as const, priority: 1, lastModified: latestRoamingModified },
    { url: `${base}/roaming`, changeFrequency: "weekly" as const, priority: 0.9, lastModified: latestRoamingModified },
    ...destinations.map((d) => {
      const destVerified = d.perNetwork
        .map((n) => networkSourcesByNetwork.get(n.network)?.verifiedAt ?? "")
        .filter(Boolean)
        .sort()
        .at(-1);
      return {
        url: `${base}/roaming/${d.countrySlug}`,
        lastModified: destVerified ? new Date(`${destVerified}T00:00:00Z`) : latestRoamingModified,
        changeFrequency: "monthly" as const,
        priority: 0.8
      };
    }),
    ...destinations.flatMap((d) =>
      NETWORKS.map((network) => {
        const src = networkSourcesByNetwork.get(network);
        return {
          url: `${base}/roaming/${d.countrySlug}/${network}`,
          lastModified: src ? new Date(`${src.verifiedAt}T00:00:00Z`) : latestRoamingModified,
          changeFrequency: "monthly" as const,
          priority: 0.7
        };
      })
    ),
    { url: `${base}/baggage-fees`, changeFrequency: "weekly" as const, priority: 0.9, lastModified: latestBaggageModified },
    ...baggageDataset.records.map((r) => ({
      url: `${base}/baggage-fees/${r.airlineSlug}`,
      lastModified: new Date(`${r.verifiedAt}T00:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: 0.8
    }))
  ];
}

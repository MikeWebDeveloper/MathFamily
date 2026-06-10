import type { MetadataRoute } from "next";
import { loadDropOffDataset } from "@mathfamily/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const records = loadDropOffDataset().records;
  return [
    { url: base, changeFrequency: "weekly" as const, priority: 1 },
    { url: `${base}/drop-off-charges`, changeFrequency: "weekly" as const, priority: 0.9 },
    ...records.map((r) => ({
      url: `${base}/drop-off-charges/${r.airportSlug}`,
      lastModified: new Date(`${r.verifiedAt}T00:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: 0.8
    }))
  ];
}

import type { MetadataRoute } from "next";
import { loadLoungeDataset } from "@mathfamily/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3003";
  const ds = loadLoungeDataset();
  const latest = ds.records.map((r) => r.verifiedAt).sort().at(-1);
  const lastModified = latest ? new Date(`${latest}T00:00:00Z`) : undefined;
  return [
    { url: base, changeFrequency: "weekly" as const, priority: 1, lastModified },
    { url: `${base}/lounge-access`, changeFrequency: "weekly" as const, priority: 0.9, lastModified },
    ...ds.records.map((r) => ({
      url: `${base}/lounge-access/${r.airportSlug}`,
      lastModified: new Date(`${r.verifiedAt}T00:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}

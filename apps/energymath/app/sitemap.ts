import type { MetadataRoute } from "next";
import { REGIONS, DATASET_LAST_UPDATED } from "@/lib/energy-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3004";
  const lastModified = new Date(`${DATASET_LAST_UPDATED}T00:00:00Z`);

  return [
    { url: base, changeFrequency: "weekly" as const, priority: 1, lastModified },
    { url: `${base}/region`, changeFrequency: "weekly" as const, priority: 0.9, lastModified },
    ...REGIONS.map((r) => ({
      url: `${base}/region/${r.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
      lastModified: new Date(`${r.verifiedAt}T00:00:00Z`)
    })),
    { url: `${base}/privacy`, changeFrequency: "yearly" as const, priority: 0.3, lastModified }
  ];
}

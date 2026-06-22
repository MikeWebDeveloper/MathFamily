import type { MetadataRoute } from "next";
import { loadDataset, latestVerified } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3004";
  const { projectTypes } = loadDataset();
  const latest = latestVerified();
  const latestModified = new Date(`${latest}T00:00:00Z`);

  return [
    { url: base, changeFrequency: "weekly" as const, priority: 1, lastModified: latestModified },
    { url: `${base}/cost`, changeFrequency: "weekly" as const, priority: 0.9, lastModified: latestModified },
    { url: `${base}/regions`, changeFrequency: "monthly" as const, priority: 0.8, lastModified: latestModified },
    ...projectTypes.map((p) => ({
      url: `${base}/cost/${p.slug}`,
      lastModified: new Date(`${p.source.verifiedAt}T00:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: 0.8
    })),
    { url: `${base}/privacy`, changeFrequency: "yearly" as const, priority: 0.3, lastModified: latestModified }
  ];
}

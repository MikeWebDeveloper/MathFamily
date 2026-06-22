import type { MetadataRoute } from "next";
import { PET_COST_RECORDS, PET_COSTS_LAST_UPDATED } from "@/lib/pet-costs";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3003";
  const lastModified = new Date(`${PET_COSTS_LAST_UPDATED}T00:00:00Z`);

  return [
    { url: base, changeFrequency: "weekly" as const, priority: 1, lastModified },
    { url: `${base}/cost`, changeFrequency: "weekly" as const, priority: 0.9, lastModified },
    ...PET_COST_RECORDS.map((r) => ({
      url: `${base}/cost/${r.slug}`,
      lastModified: new Date(`${r.verifiedAt}T00:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: 0.8
    })),
    { url: `${base}/privacy`, changeFrequency: "yearly" as const, priority: 0.3, lastModified }
  ];
}

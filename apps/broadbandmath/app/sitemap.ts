import type { MetadataRoute } from "next";
import { loadBroadbandDataset, listProviders } from "@/lib/broadband-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002";
  const { speedTiers, lastUpdated } = loadBroadbandDataset();
  const providers = listProviders();
  const lastModified = new Date(`${lastUpdated}T00:00:00Z`);

  return [
    { url: base, changeFrequency: "weekly", priority: 1, lastModified },
    { url: `${base}/provider`, changeFrequency: "weekly", priority: 0.9, lastModified },
    { url: `${base}/speed`, changeFrequency: "weekly", priority: 0.9, lastModified },
    ...providers.map((p) => ({
      url: `${base}/provider/${p.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
      lastModified
    })),
    ...speedTiers.map((t) => ({
      url: `${base}/speed/${t.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
      lastModified
    })),
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.3, lastModified }
  ];
}

import type { MetadataRoute } from "next";
import { SPOKES } from "@/lib/spokes";
import { VERIFIED_AT } from "@/lib/dataset";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002";
  const lastModified = new Date(`${VERIFIED_AT}T00:00:00Z`);

  return [
    { url: base, changeFrequency: "weekly" as const, priority: 1, lastModified },
    { url: `${base}/buying`, changeFrequency: "weekly" as const, priority: 0.9, lastModified },
    ...SPOKES.map((s) => ({
      url: `${base}/buying/${s.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
      lastModified
    })),
    { url: `${base}/privacy`, changeFrequency: "yearly" as const, priority: 0.3, lastModified }
  ];
}

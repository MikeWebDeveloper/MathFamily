import type { MetadataRoute } from "next";
import { TREATMENTS, latestVerifiedAt } from "@/lib/dental-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3003";
  const verified = latestVerifiedAt();
  const lastModified = verified ? new Date(`${verified}T00:00:00Z`) : undefined;

  return [
    { url: base, changeFrequency: "weekly" as const, priority: 1, lastModified },
    { url: `${base}/treatments`, changeFrequency: "weekly" as const, priority: 0.9, lastModified },
    { url: `${base}/nhs-dental-charges`, changeFrequency: "monthly" as const, priority: 0.9, lastModified },
    ...TREATMENTS.map((t) => ({
      url: `${base}/treatments/${t.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
      lastModified
    })),
    { url: `${base}/privacy`, changeFrequency: "yearly" as const, priority: 0.3, lastModified }
  ];
}

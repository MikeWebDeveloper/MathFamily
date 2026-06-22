import type { MetadataRoute } from "next";
import { TRADES } from "@/lib/trades";
import { DATASET_VERIFIED_AT } from "@/lib/tax-rates";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002";
  const lastModified = new Date(`${DATASET_VERIFIED_AT}T00:00:00Z`);

  return [
    { url: base, changeFrequency: "monthly" as const, priority: 1, lastModified },
    { url: `${base}/take-home`, changeFrequency: "monthly" as const, priority: 0.9, lastModified },
    ...TRADES.map((t) => ({
      url: `${base}/take-home/${t.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
      lastModified
    })),
    { url: `${base}/privacy`, changeFrequency: "yearly" as const, priority: 0.3, lastModified }
  ];
}

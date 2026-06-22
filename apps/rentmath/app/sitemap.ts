import type { MetadataRoute } from "next";
import { TOWNS, datasetLatestVerifiedAt } from "../lib/rent-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
  const latest = datasetLatestVerifiedAt();
  const latestModified = new Date(`${latest}T00:00:00Z`);

  return [
    { url: base, changeFrequency: "weekly" as const, priority: 1, lastModified: latestModified },
    { url: `${base}/towns`, changeFrequency: "weekly" as const, priority: 0.9, lastModified: latestModified },
    ...TOWNS.map((t) => {
      const verified = [t.rentSource.verifiedAt, t.councilTaxSource.verifiedAt, t.billsSource.verifiedAt].sort().at(-1)!;
      return {
        url: `${base}/towns/${t.townSlug}`,
        lastModified: new Date(`${verified}T00:00:00Z`),
        changeFrequency: "monthly" as const,
        priority: 0.8
      };
    }),
    { url: `${base}/privacy`, changeFrequency: "yearly" as const, priority: 0.3 }
  ];
}

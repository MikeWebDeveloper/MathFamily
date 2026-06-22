import type { MetadataRoute } from "next";
import { loadDropOffDataset, loadParkingDataset, loadLoungeDataset, recentNews, loadNewsDataset } from "@mathfamily/data";

const DURATION_SLUGS = ["3-days", "7-days", "14-days"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const dropOffRecords = loadDropOffDataset().records;
  const parkingRecords = loadParkingDataset().records;
  const loungeRecords = loadLoungeDataset().records;

  const latestDropOff = dropOffRecords.map((r) => r.verifiedAt).sort().at(-1);
  const latestModified = latestDropOff ? new Date(`${latestDropOff}T00:00:00Z`) : undefined;

  const latestParking = parkingRecords.map((r) => r.verifiedAt).sort().at(-1);
  const latestParkingModified = latestParking ? new Date(`${latestParking}T00:00:00Z`) : undefined;

  const latestLounge = loungeRecords.map((r) => r.verifiedAt).sort().at(-1);
  const latestLoungeModified = latestLounge ? new Date(`${latestLounge}T00:00:00Z`) : undefined;

  return [
    { url: base, changeFrequency: "weekly" as const, priority: 1, lastModified: latestModified },
    { url: `${base}/about`, changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${base}/methodology`, changeFrequency: "monthly" as const, priority: 0.6, lastModified: latestModified },
    { url: `${base}/embed`, changeFrequency: "monthly" as const, priority: 0.5, lastModified: latestModified },
    { url: `${base}/parking-price-index-2026`, changeFrequency: "monthly" as const, priority: 0.8, lastModified: latestModified },
    { url: `${base}/drop-off-charges`, changeFrequency: "weekly" as const, priority: 0.9, lastModified: latestModified },
    ...dropOffRecords.map((r) => ({
      url: `${base}/drop-off-charges/${r.airportSlug}`,
      lastModified: new Date(`${r.verifiedAt}T00:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: 0.8
    })),
    { url: `${base}/avoid-drop-off-charge`, changeFrequency: "weekly" as const, priority: 0.8, lastModified: latestModified },
    ...dropOffRecords
      .filter((r) => !r.isFree && r.freeAlternative !== null)
      .map((r) => ({
        url: `${base}/avoid-drop-off-charge/${r.airportSlug}`,
        lastModified: new Date(`${r.verifiedAt}T00:00:00Z`),
        changeFrequency: "monthly" as const,
        priority: 0.7
      })),
    { url: `${base}/blue-badge`, changeFrequency: "weekly" as const, priority: 0.8, lastModified: latestModified },
    ...dropOffRecords
      .filter((r) => r.blueBadgePolicy.trim().length > 0)
      .map((r) => ({
        url: `${base}/blue-badge/${r.airportSlug}`,
        lastModified: new Date(`${r.verifiedAt}T00:00:00Z`),
        changeFrequency: "monthly" as const,
        priority: 0.7
      })),
    { url: `${base}/parking-vs-drop-off`, changeFrequency: "weekly" as const, priority: 0.8, lastModified: latestParkingModified },
    ...dropOffRecords
      .filter((d) => {
        if (d.isFree || (d.bands[0]?.totalPence ?? null) === null) return false;
        const p = parkingRecords.find((r) => r.airportSlug === d.airportSlug);
        return Boolean(p?.products.some((prod) => prod.productType === "gate" && prod.prices.some((pr) => pr.days === 7)));
      })
      .map((d) => ({
        url: `${base}/parking-vs-drop-off/${d.airportSlug}`,
        lastModified: new Date(`${d.verifiedAt}T00:00:00Z`),
        changeFrequency: "monthly" as const,
        priority: 0.7
      })),
    { url: `${base}/airport-parking-options`, changeFrequency: "weekly" as const, priority: 0.85, lastModified: latestModified },
    ...dropOffRecords.map((r) => ({
      url: `${base}/airport-parking-options/${r.airportSlug}`,
      lastModified: new Date(`${r.verifiedAt}T00:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: 0.75
    })),
    { url: `${base}/airport-parking`, changeFrequency: "weekly" as const, priority: 0.9, lastModified: latestParkingModified },
    ...parkingRecords.map((r) => ({
      url: `${base}/airport-parking/${r.airportSlug}`,
      lastModified: new Date(`${r.verifiedAt}T00:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: 0.8
    })),
    ...parkingRecords.flatMap((r) =>
      DURATION_SLUGS.map((duration) => ({
        url: `${base}/airport-parking/${r.airportSlug}/${duration}`,
        lastModified: new Date(`${r.verifiedAt}T00:00:00Z`),
        changeFrequency: "monthly" as const,
        priority: 0.7
      }))
    ),
    { url: `${base}/airport-lounges`, changeFrequency: "weekly" as const, priority: 0.9, lastModified: latestLoungeModified },
    ...loungeRecords.map((r) => ({
      url: `${base}/airport-lounges/${r.airportSlug}`,
      lastModified: new Date(`${r.verifiedAt}T00:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: 0.8
    })),
    { url: `${base}/news`, changeFrequency: "daily" as const, priority: 0.9, lastModified: (() => {
        const latest = recentNews(1)[0];
        return latest ? new Date(`${latest.verifiedAt}T00:00:00Z`) : undefined;
      })() },
    ...recentNews().map((i) => ({
      url: `${base}/news/${i.id}`,
      lastModified: new Date(`${i.verifiedAt}T00:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: 0.6
    })),
  ];
}

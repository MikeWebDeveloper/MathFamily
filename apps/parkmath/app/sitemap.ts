import type { MetadataRoute } from "next";
import { loadDropOffDataset, loadParkingDataset, loadLoungeDataset } from "@mathfamily/data";

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
    { url: `${base}/drop-off-charges`, changeFrequency: "weekly" as const, priority: 0.9, lastModified: latestModified },
    ...dropOffRecords.map((r) => ({
      url: `${base}/drop-off-charges/${r.airportSlug}`,
      lastModified: new Date(`${r.verifiedAt}T00:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: 0.8
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
    }))
  ];
}

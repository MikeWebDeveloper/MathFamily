import { z } from "zod";
import roamingJson from "../datasets/roammath/roaming.json";
import { HttpUrl, IsoDate, Slug } from "./zod-helpers";

export const NETWORKS = ["ee", "o2", "vodafone", "three"] as const;
export type Network = (typeof NETWORKS)[number];

export const NetworkRoamingSchema = z.strictObject({
  network: z.enum(NETWORKS),
  included: z.boolean(),
  dailyPassPence: z.number().int().nonnegative().nullable(),
  passName: z.string().nullable(),
  fairUseNote: z.string().nullable()
});
export type NetworkRoaming = z.infer<typeof NetworkRoamingSchema>;

export const RoamingDestinationSchema = z
  .strictObject({
    countrySlug: Slug,
    countryName: z.string().min(1),
    perNetwork: z.array(NetworkRoamingSchema).length(4),
    sourceNote: z.string().nullable()
  })
  .refine((d) => new Set(d.perNetwork.map((n) => n.network)).size === 4, {
    message: "each of the four networks must appear exactly once"
  });
export type RoamingDestination = z.infer<typeof RoamingDestinationSchema>;

export const RoamingDatasetSchema = z.strictObject({
  version: z.string().min(1),
  lastUpdated: IsoDate,
  networkSources: z
    .array(z.strictObject({ network: z.enum(NETWORKS), sourceUrl: HttpUrl, verifiedAt: IsoDate }))
    .length(4),
  destinations: z.array(RoamingDestinationSchema).min(1)
});
export type RoamingDataset = z.infer<typeof RoamingDatasetSchema>;

export function loadRoamingDataset(): RoamingDataset {
  return RoamingDatasetSchema.parse(roamingJson);
}

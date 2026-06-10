import { z } from "zod";
import parkingJson from "../datasets/parkmath/parking-tariffs.json";
import { IsoDate, Slug, HttpUrl } from "./zod-helpers";

export const ParkingPriceSchema = z.strictObject({
  days: z.number().int().positive(),
  totalPence: z.number().int().nonnegative()
});

export const ParkingProductSchema = z
  .strictObject({
    productType: z.enum(["gate", "prebook", "meet-greet", "park-ride"]),
    name: z.string().min(1),
    prices: z.array(ParkingPriceSchema).min(1),
    snapshotDate: IsoDate.nullable(),
    notes: z.string().nullable()
  })
  .refine((p) => p.productType !== "prebook" || p.snapshotDate !== null, {
    message: "prebook products must carry the snapshotDate of the quote"
  });
export type ParkingProduct = z.infer<typeof ParkingProductSchema>;

export const ParkingRecordSchema = z.strictObject({
  airportSlug: Slug,
  products: z.array(ParkingProductSchema).min(1),
  sourceUrl: HttpUrl,
  verifiedAt: IsoDate
});
export type ParkingRecord = z.infer<typeof ParkingRecordSchema>;

export const ParkingDatasetSchema = z.strictObject({
  version: z.string().min(1),
  lastUpdated: IsoDate,
  records: z.array(ParkingRecordSchema).min(1)
});
export type ParkingDataset = z.infer<typeof ParkingDatasetSchema>;

export function loadParkingDataset(): ParkingDataset {
  return ParkingDatasetSchema.parse(parkingJson);
}

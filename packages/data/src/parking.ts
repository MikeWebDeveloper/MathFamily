import { z } from "zod";
import parkingJson from "../datasets/parkmath/parking-tariffs.json";

const IsoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD")
  .refine((s) => {
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }, "not a real calendar date");
const Slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "expected lowercase-kebab slug");
const HttpUrl = z.string().regex(/^https?:\/\/\S+$/, "expected absolute http(s) URL");

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

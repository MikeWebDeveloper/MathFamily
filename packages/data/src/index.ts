import airportsJson from "../datasets/airports.json";
import dropOffJson from "../datasets/parkmath/drop-off-fees.json";
import { AirportsFileSchema, DropOffDatasetSchema, type Airport, type DropOffDataset } from "./schemas";

export * from "./schemas";
export * from "./freshness";

export function loadAirports(): Airport[] {
  return AirportsFileSchema.parse(airportsJson);
}

export function loadDropOffDataset(): DropOffDataset {
  return DropOffDatasetSchema.parse(dropOffJson);
}

export * from "./parking";
export * from "./lounges";
export * from "./roaming";

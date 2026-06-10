import airportsJson from "../datasets/airports.json";
import dropOffJson from "../datasets/parkmath/drop-off-fees.json";
import { AirportsFileSchema, DropOffDatasetSchema, type Airport, type DropOffDataset } from "./schemas";

export * from "./schemas";

export function loadAirports(): Airport[] {
  return AirportsFileSchema.parse(airportsJson);
}

export function loadDropOffDataset(): DropOffDataset {
  return DropOffDatasetSchema.parse(dropOffJson);
}

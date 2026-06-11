import { describe, expect, it } from "vitest";
import { loadAirports } from "../src/index";

describe("airport coordinates", () => {
  it("every airport has lat/lng inside the UK bounding box", () => {
    for (const a of loadAirports()) {
      expect(a.lat, a.slug).toBeGreaterThan(49.8);
      expect(a.lat, a.slug).toBeLessThan(61);
      expect(a.lng, a.slug).toBeGreaterThan(-8.5);
      expect(a.lng, a.slug).toBeLessThan(2);
    }
  });
});

import { describe, expect, it } from "vitest";
import { haversineKm, nearestAirports } from "../src/geo-distance";

type TestAirport = { name: string; slug: string; iata: string; region: string; lat: number; lng: number };

const mk = (slug: string, name: string, iata: string, lat: number, lng: number): TestAirport => ({
  name, slug, iata, region: "Test", lat, lng,
});

const airports: TestAirport[] = [
  mk("heathrow", "Heathrow", "LHR", 51.47, -0.4543),
  mk("gatwick", "Gatwick", "LGW", 51.1537, -0.1821),
  mk("manchester", "Manchester", "MAN", 53.3537, -2.275),
  mk("edinburgh", "Edinburgh", "EDI", 55.95, -3.3725),
];

describe("haversineKm", () => {
  it("is zero for identical points", () => {
    expect(haversineKm(51.5, -0.12, 51.5, -0.12)).toBe(0);
  });
  it("matches a known distance (London ↔ Edinburgh ≈ 530 km)", () => {
    const km = haversineKm(51.5074, -0.1278, 55.9533, -3.1883);
    expect(km).toBeGreaterThan(520);
    expect(km).toBeLessThan(540);
  });
});

describe("nearestAirports", () => {
  it("returns the n closest, nearest first (central London → LHR then LGW)", () => {
    const res = nearestAirports(51.5074, -0.1278, airports, 2);
    expect(res.map((r) => r.airport.slug)).toEqual(["heathrow", "gatwick"]);
  });
  it("orders strictly by ascending distance", () => {
    const ds = nearestAirports(53.0, -2.0, airports, 4).map((r) => r.distanceKm);
    expect([...ds]).toEqual([...ds].sort((x, y) => x - y));
  });
  it("never returns more than n", () => {
    expect(nearestAirports(51.5, -0.1, airports, 3)).toHaveLength(3);
  });
});

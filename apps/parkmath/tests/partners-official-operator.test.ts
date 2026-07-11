import { describe, expect, it, vi } from "vitest";
import { resolveAllParkingMerchants } from "../lib/partners";

// Synthetic fixture — proves the isOfficialOperator "pin first" rule is genuinely DATA-DRIVEN and
// general, not secretly still Heathrow-specific code. Two different partners are each flagged
// isOfficialOperator for different airports, with no per-airport map (no `primaryOverrides`-style
// field exists anymore) driving any of it — only the boolean on the partner's own config entry.
//
// Fixture shape (deliberately NOT alphabetically-first, so pinning is observable rather than
// coincidental with natural alphabetical order):
//  - "Cheap Co" / "Value Co": ordinary third-party partners, template-covered everywhere (like
//    Holiday Extras in the real dataset).
//  - "Zulu Official": isOfficialOperator, genuinely covers airport-a AND airport-c.
//  - "Yankee Official": isOfficialOperator, genuinely covers ONLY airport-c.
//  - airport-b: covered only by the two ordinary partners — no official operator anywhere.
vi.mock("../lib/partners.json", () => ({
  default: {
    awin: { publisherId: "TEST-PUB" },
    partners: {
      "cheap-co": {
        name: "Cheap Co",
        awinmid: "9001",
        active: true,
        termsUrl: "https://cheap.example.com/",
        landingUrl: "https://cheap.example.com/",
        products: { parking: { url: "https://cheap.example.com/", label: "parking" } },
        airportParkingUrl: { template: "https://cheap.example.com/{slug}" },
      },
      "value-co": {
        name: "Value Co",
        awinmid: "9002",
        active: true,
        termsUrl: "https://value.example.com/",
        landingUrl: "https://value.example.com/",
        products: { parking: { url: "https://value.example.com/", label: "parking" } },
        airportParkingUrl: { template: "https://value.example.com/{slug}" },
      },
      "zulu-official": {
        name: "Zulu Official",
        awinmid: "9003",
        active: true,
        isOfficialOperator: true,
        termsUrl: "https://zulu.example.com/",
        landingUrl: "https://zulu.example.com/",
        products: { parking: { url: "https://zulu.example.com/", label: "parking" } },
        airportParkingUrl: {
          byAirport: {
            "airport-a": "https://zulu.example.com/airport-a/parking",
            "airport-c": "https://zulu.example.com/airport-c/parking",
          },
        },
      },
      "yankee-official": {
        name: "Yankee Official",
        awinmid: "9004",
        active: true,
        isOfficialOperator: true,
        termsUrl: "https://yankee.example.com/",
        landingUrl: "https://yankee.example.com/",
        products: { parking: { url: "https://yankee.example.com/", label: "parking" } },
        airportParkingUrl: { byAirport: { "airport-c": "https://yankee.example.com/airport-c/parking" } },
      },
    },
    slots: [
      { id: "parking-prebook", partnerIds: ["cheap-co", "value-co"], active: true },
      { id: "lounge-membership", partnerIds: [], active: false },
    ],
  },
}));

describe("isOfficialOperator — general, data-driven pin-first mechanism (synthetic fixture)", () => {
  it("pins the flagged official operator first at the airport it genuinely covers — not just where it'd sort first anyway", () => {
    const opts = resolveAllParkingMerchants("airport-a", "test");
    // Natural alphabetical order would be Cheap Co, Value Co, Zulu Official — the pin visibly moves
    // Zulu Official from 3rd to 1st, proving this is a real reorder, not a coincidence of naming.
    expect(opts.map((o) => o.partnerName)).toEqual(["Zulu Official", "Cheap Co", "Value Co"]);
    expect(opts.find((o) => o.partnerName === "Zulu Official")!.isPinnedPrimary).toBe(true);
    expect(opts.filter((o) => o.isPinnedPrimary)).toHaveLength(1);
  });

  it("a DIFFERENT airport with NO covering official operator stays purely alphabetical — no leakage from the flag existing elsewhere", () => {
    const opts = resolveAllParkingMerchants("airport-b", "test");
    expect(opts.map((o) => o.partnerName)).toEqual(["Cheap Co", "Value Co"]);
    expect(opts.every((o) => o.isPinnedPrimary === false)).toBe(true);
    // Neither official partner appears here at all — each is airport-scoped by its own coverage,
    // automatically, with no per-airport map entry required anywhere in the fixture.
    expect(opts.map((o) => o.partnerName)).not.toContain("Zulu Official");
    expect(opts.map((o) => o.partnerName)).not.toContain("Yankee Official");
  });

  it("TWO official operators covering the SAME airport both pin to the front, in alphabetical order relative to each other", () => {
    const opts = resolveAllParkingMerchants("airport-c", "test");
    expect(opts.map((o) => o.partnerName)).toEqual(["Yankee Official", "Zulu Official", "Cheap Co", "Value Co"]);
    expect(opts.filter((o) => o.isPinnedPrimary).map((o) => o.partnerName)).toEqual(["Yankee Official", "Zulu Official"]);
  });

  it("returns [] for a non-airport context regardless of any official operator in the dataset", () => {
    expect(resolveAllParkingMerchants("home", "test")).toEqual([]);
  });
});

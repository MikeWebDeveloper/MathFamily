import { describe, expect, it } from "vitest";
import { RoamingDestinationSchema, loadRoamingDataset, NETWORKS } from "../src/roaming";

const validDestination = {
  countrySlug: "spain",
  countryName: "Spain",
  iso2: "es",
  perNetwork: [
    { network: "ee", included: false, dailyPassPence: 259, passName: "EU Roaming Pass", fairUseNote: "50GB fair use" },
    { network: "o2", included: true, dailyPassPence: null, passName: null, fairUseNote: "25GB roaming limit applies" },
    { network: "vodafone", included: false, dailyPassPence: 257, passName: "8-day European Roaming Pass (per-day equivalent)", fairUseNote: "25GB fair use" },
    { network: "three", included: false, dailyPassPence: 200, passName: "Go Roam Europe daily charge", fairUseNote: "12GB daily cap" }
  ],
  sourceNote: null
};

describe("RoamingDestinationSchema", () => {
  it("accepts a valid destination with all four networks", () => {
    expect(() => RoamingDestinationSchema.parse(validDestination)).not.toThrow();
  });
  it("rejects a destination missing a network", () => {
    expect(() =>
      RoamingDestinationSchema.parse({ ...validDestination, perNetwork: validDestination.perNetwork.slice(0, 3) })
    ).toThrow();
  });
  it("rejects duplicate networks", () => {
    const dup = [...validDestination.perNetwork.slice(0, 3), { ...validDestination.perNetwork[0]! }];
    expect(() => RoamingDestinationSchema.parse({ ...validDestination, perNetwork: dup })).toThrow();
  });
  it("accepts a non-included network without a daily pass (none published)", () => {
    const noPass = structuredClone(validDestination);
    noPass.perNetwork[0]!.dailyPassPence = null;
    noPass.perNetwork[0]!.fairUseNote = "No standard daily pass — pay-per-use rates apply";
    expect(() => RoamingDestinationSchema.parse(noPass)).not.toThrow();
  });
});

describe("loadRoamingDataset", () => {
  it("loads, validates, and carries four network sources", () => {
    const d = loadRoamingDataset();
    expect(d.networkSources.map((s) => s.network).sort()).toEqual([...NETWORKS].sort());
    expect(d.destinations.length).toBeGreaterThanOrEqual(1);
  });
});

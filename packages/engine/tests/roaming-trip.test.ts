import { describe, expect, it } from "vitest";
import { roamingTripCost, type EsimBundleOption, type NetworkRoamingOption } from "../src/roaming-trip";

const networks: NetworkRoamingOption[] = [
  { network: "ee", included: false, dailyPassPence: 259, passName: "EU pass", fairUseNote: null },
  { network: "o2", included: true, dailyPassPence: null, passName: null, fairUseNote: "25GB limit" },
  { network: "vodafone", included: false, dailyPassPence: 257, passName: "EU pass", fairUseNote: null },
  { network: "three", included: false, dailyPassPence: 200, passName: "Go Roam", fairUseNote: "12GB cap" }
];

const esims: EsimBundleOption[] = [
  { provider: "airalo", bundleName: "5GB/30d", dataGb: 5, validityDays: 30, totalPence: 1150, snapshotDate: "2026-06-10" },
  { provider: "holafly", bundleName: "Unlimited 7d", dataGb: null, validityDays: 7, totalPence: 2700, snapshotDate: "2026-06-10" },
  { provider: "saily", bundleName: "3GB/30d", dataGb: 3, validityDays: 30, totalPence: 750, snapshotDate: "2026-06-10" }
];

describe("roamingTripCost", () => {
  it("computes per-network totals (included networks cost zero)", () => {
    const r = roamingTripCost(networks, esims, 7, 5);
    expect(r.networkCosts.find((n) => n.network === "o2")?.totalPence).toBe(0);
    expect(r.networkCosts.find((n) => n.network === "three")?.totalPence).toBe(1400);
  });
  it("picks the cheapest eligible eSIM (enough data, enough validity)", () => {
    const r = roamingTripCost(networks, esims, 7, 5);
    expect(r.esimChoice?.bundleName).toBe("5GB/30d"); // saily 3GB too small, airalo cheapest eligible
  });
  it("an unlimited bundle satisfies any data need", () => {
    const r = roamingTripCost(networks, esims, 7, 50);
    expect(r.esimChoice?.bundleName).toBe("Unlimited 7d");
  });
  it("verdict compares cheapest network vs eSIM with savings", () => {
    const r = roamingTripCost(networks, esims, 7, 5);
    expect(r.cheapestNetwork?.network).toBe("o2"); // 0p — included
    expect(r.verdict).toBe("network");
    expect(r.savingsPence).toBe(0);
  });
  it("eSIM wins when no network includes roaming", () => {
    const noneIncluded = networks.map((n) => (n.network === "o2" ? { ...n, included: false, dailyPassPence: 250 } : n));
    const r = roamingTripCost(noneIncluded, esims, 7, 5);
    expect(r.verdict).toBe("esim");
    expect(r.savingsPence).toBe(1400 - 1150); // three £14 vs airalo £11.50
  });
  it("warns when no eSIM covers the trip and flags snapshots", () => {
    const r = roamingTripCost(networks, esims, 45, 5);
    expect(r.esimChoice).toBeNull(); // a 45-day trip exceeds every bundle's validity
    expect(r.warnings.map((w) => w.code)).toContain("NO_ESIM_COVERS");
    const short = roamingTripCost(networks, esims, 7, 5);
    expect(short.warnings.map((w) => w.code)).toContain("ESIM_SNAPSHOT");
  });
  it("clamps nonsense input without throwing", () => {
    expect(() => roamingTripCost(networks, esims, -4, Number.NaN)).not.toThrow();
    expect(roamingTripCost(networks, esims, -4, Number.NaN).days).toBe(1);
  });
  it("does not double-period a fairUseNote that already ends with a full stop", () => {
    const periodTerminated = networks.map((n) =>
      n.network === "o2" ? { ...n, fairUseNote: "25GB cap." } : n
    );
    const r = roamingTripCost(periodTerminated, esims, 7, 5);
    const fairUse = r.warnings.find((w) => w.code === "FAIR_USE");
    expect(fairUse?.message).toBe("O2: 25GB cap.");
    expect(fairUse?.message.includes("..")).toBe(false);
  });
});

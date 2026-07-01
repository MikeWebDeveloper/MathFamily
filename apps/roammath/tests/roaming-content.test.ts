import { describe, expect, it } from "vitest";
import type { EsimCountry, RoamingDestination } from "@mathfamily/data";
import { buildRoamingFaqs, networkIncludedVerdict, roamingPageModel, NETWORK_LABELS } from "../lib/roaming-content";

const destination: RoamingDestination = {
  countrySlug: "spain",
  countryName: "Spain",
  iso2: "es",
  perNetwork: [
    { network: "ee", included: false, dailyPassPence: 259, passName: "EU Roaming Pass", fairUseNote: "50GB fair use" },
    { network: "o2", included: true, dailyPassPence: null, passName: null, fairUseNote: "25GB roaming limit" },
    { network: "vodafone", included: false, dailyPassPence: 257, passName: "EU pass", fairUseNote: null },
    { network: "three", included: false, dailyPassPence: 200, passName: "Go Roam", fairUseNote: "12GB cap" }
  ],
  sourceNote: null
};

const esim: EsimCountry = {
  countrySlug: "spain",
  bundles: [{ provider: "airalo", bundleName: "5GB/30d", dataGb: 5, validityDays: 30, totalPence: 1150, snapshotDate: "2026-06-10" }],
  sourceUrl: "https://www.airalo.com/spain-esim",
  verifiedAt: "2026-06-10"
};

describe("roamingPageModel", () => {
  it("answers with the included network when one exists", () => {
    const m = roamingPageModel(destination, esim, 7, 5);
    expect(m.answer).toContain("O2");
    expect(m.answer.toLowerCase()).toContain("no extra daily charge");
  });
  it("produces distinct models for different trip lengths (anti-thin-content)", () => {
    const a = JSON.stringify(roamingPageModel(destination, esim, 3, 2));
    const b = JSON.stringify(roamingPageModel(destination, esim, 14, 10));
    expect(a).not.toBe(b);
  });
});

describe("networkIncludedVerdict", () => {
  it("names the specific included network, not a generic 'your network'", () => {
    const m = roamingPageModel(destination, esim, 7, 5);
    const verdict = networkIncludedVerdict(destination, m);
    expect(verdict).toContain("O2");
    expect(verdict.toLowerCase()).not.toContain("your network");
  });
  it("states what the paying networks charge for the same trip, as a range", () => {
    const m = roamingPageModel(destination, esim, 7, 5);
    const verdict = networkIncludedVerdict(destination, m);
    expect(verdict).toContain("EE");
    expect(verdict).toContain("Vodafone");
    expect(verdict).toContain("Three");
    // EE: 259p/day * 7 = £18.13; Vodafone: 257p/day * 7 = £17.99; Three: 200p/day * 7 = £14 (whole pounds, no decimals)
    expect(verdict).toContain("from £14 to £18.13");
  });
  it("returns empty string when no network is included (nothing to name)", () => {
    const noIncluded: RoamingDestination = {
      ...destination,
      perNetwork: destination.perNetwork.map((n) => ({ ...n, included: false, dailyPassPence: n.dailyPassPence ?? 250 }))
    };
    const m = roamingPageModel(noIncluded, esim, 7, 5);
    expect(networkIncludedVerdict(noIncluded, m)).toBe("");
  });
});

describe("buildRoamingFaqs", () => {
  it("includes per-network cost question and eSIM question", () => {
    const faqs = buildRoamingFaqs(destination, esim, 7);
    expect(faqs.some((f) => f.question.includes("EE"))).toBe(true);
    expect(faqs.some((f) => f.question.toLowerCase().includes("esim"))).toBe(true);
  });
});

describe("NETWORK_LABELS", () => {
  it("maps all four network slugs", () => {
    expect(Object.keys(NETWORK_LABELS).sort()).toEqual(["ee", "o2", "three", "vodafone"]);
  });
});

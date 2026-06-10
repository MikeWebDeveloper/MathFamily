import { describe, expect, it } from "vitest";
import type { EsimCountry, RoamingDestination } from "@mathfamily/data";
import { buildRoamingFaqs, roamingPageModel, NETWORK_LABELS } from "../lib/roaming-content";

const destination: RoamingDestination = {
  countrySlug: "spain",
  countryName: "Spain",
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

import { describe, it, expect } from "vitest";
import { loadLoungeDataset, loadPriorityPass, loadAirports } from "@mathfamily/data";
import {
  buildLoungePageModel,
  accessMethods,
  breakEvenVerdict,
  buildLoungeFaqs,
  allLoungeSlugs,
} from "../lib/lounge-content";
import { resolveSlot, resolveGoTarget, buildAwinLink } from "../lib/partners";

describe("LoungeMath lounge dataset", () => {
  it("loads (Zod-validated) and every record carries provenance", () => {
    const ds = loadLoungeDataset();
    expect(ds.version).toBeTruthy();
    expect(ds.records.length).toBeGreaterThan(0);
    for (const r of ds.records) {
      expect(r.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.sourceUrl.startsWith("https://")).toBe(true);
      expect(r.lounges.length).toBeGreaterThan(0);
      for (const l of r.lounges) {
        // never fabricate a price: walk-in is either a positive integer or null
        if (l.walkInPence !== null) expect(Number.isInteger(l.walkInPence) && l.walkInPence > 0).toBe(true);
      }
    }
  });

  it("every lounge airport slug resolves to a known airport", () => {
    const airports = loadAirports();
    for (const slug of allLoungeSlugs()) {
      expect(airports.some((a) => a.slug === slug)).toBe(true);
    }
  });

  it("Priority Pass tiers are verified and sane", () => {
    const pp = loadPriorityPass();
    expect(pp.sourceUrl.startsWith("https://")).toBe(true);
    expect(pp.tiers.length).toBeGreaterThan(0);
  });
});

describe("lounge-content model", () => {
  it("builds a model for every airport with the right shape", () => {
    for (const slug of allLoungeSlugs()) {
      const m = buildLoungePageModel(slug);
      expect(m).not.toBeNull();
      if (!m) continue;
      expect(m.airport.slug).toBe(slug);
      expect(m.lounges.length).toBeGreaterThan(0);
      // access methods always include at least the credit-card route
      expect(accessMethods(m).length).toBeGreaterThan(0);
      // FAQs are non-empty and answerable
      expect(buildLoungeFaqs(m).length).toBeGreaterThan(0);
      // verdict sentence is produced
      expect(breakEvenVerdict(m).length).toBeGreaterThan(10);
    }
  });

  it("returns null for an unknown airport", () => {
    expect(buildLoungePageModel("not-an-airport")).toBeNull();
  });

  it("computes a break-even when a walk-in price exists", () => {
    const heathrow = buildLoungePageModel("heathrow");
    expect(heathrow).not.toBeNull();
    expect(heathrow?.cheapestWalkInPence).toBeGreaterThan(0);
    expect(heathrow?.breakEven).not.toBeNull();
  });
});

describe("partners (fail-closed, dormant)", () => {
  it("resolves to official (no affiliate) while the Priority Pass programme is dormant", () => {
    const r = resolveSlot("primary", "heathrow", "");
    expect(r.kind).toBe("official");
    expect(r.disclosureRequired).toBe(false);
    expect(r.partnerName).toBeNull();
  });

  it("/go target resolves to null (⇒ 404) while dormant — no open redirect", () => {
    expect(resolveGoTarget("primary", "heathrow")).toBeNull();
    expect(resolveGoTarget("unknown", "heathrow")).toBeNull();
  });

  it("builds a correct AWIN deep link when given live params (unit, not wired)", () => {
    const url = buildAwinLink({ awinmid: "60243", publisherId: "999", key: "heathrow" });
    expect(url).toContain("https://www.awin1.com/cread.php?");
    expect(url).toContain("awinmid=60243");
    expect(url).toContain("clickref=loungemath-heathrow");
  });
});

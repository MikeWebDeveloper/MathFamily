import { describe, expect, it } from "vitest";
import { freshnessReport, FRESHNESS_FAIL_DAYS, FRESHNESS_WARN_DAYS } from "../src/freshness";
import { loadDropOffDataset } from "../src/index";

const NOW = new Date("2026-06-10T12:00:00Z");

describe("freshnessReport", () => {
  it("passes fresh records", () => {
    const report = freshnessReport([{ label: "gatwick", verifiedAt: "2026-06-01" }], NOW);
    expect(report.warnings).toEqual([]);
    expect(report.errors).toEqual([]);
  });
  it("warns past the warning threshold", () => {
    const report = freshnessReport([{ label: "gatwick", verifiedAt: "2026-03-01" }], NOW);
    expect(report.warnings.length).toBe(1);
    expect(report.warnings[0]).toContain("gatwick");
    expect(report.errors).toEqual([]);
  });
  it("errors past the failure threshold", () => {
    const report = freshnessReport([{ label: "gatwick", verifiedAt: "2026-01-01" }], NOW);
    expect(report.errors.length).toBe(1);
  });
  it("thresholds match the spec", () => {
    expect(FRESHNESS_WARN_DAYS).toBe(60);
    expect(FRESHNESS_FAIL_DAYS).toBe(120);
  });
  it("exactly 60 days old is clean", () => {
    const report = freshnessReport([{ label: "x", verifiedAt: "2026-04-11" }], NOW);
    expect(report.warnings).toEqual([]);
    expect(report.errors).toEqual([]);
  });
  it("exactly 120 days old is not an error", () => {
    const report = freshnessReport([{ label: "x", verifiedAt: "2026-02-10" }], NOW);
    expect(report.errors).toEqual([]);
  });
});

describe("live dataset freshness gate (CI)", () => {
  it("no record in the real dataset is older than the failure threshold", () => {
    const dataset = loadDropOffDataset();
    const report = freshnessReport(
      dataset.records.map((r) => ({ label: r.airportSlug, verifiedAt: r.verifiedAt })),
      new Date()
    );
    for (const warning of report.warnings) console.warn(`[freshness] ${warning}`);
    expect(report.errors).toEqual([]);
  });
});

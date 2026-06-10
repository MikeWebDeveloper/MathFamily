import { describe, expect, it } from "vitest";
import { loadAirports, loadLoungeDataset, loadPriorityPass } from "../src/index";

describe("lounge dataset", () => {
  it("covers the 10 launch airports", () => {
    const expected = ["heathrow", "gatwick", "manchester", "stansted", "luton", "edinburgh", "birmingham", "glasgow", "bristol", "newcastle"].sort();
    expect(loadLoungeDataset().records.map((r) => r.airportSlug).sort()).toEqual(expected);
  });
  it("every slug is a known airport", () => {
    const known = new Set(loadAirports().map((a) => a.slug));
    for (const r of loadLoungeDataset().records) expect(known.has(r.airportSlug)).toBe(true);
  });
  it("Priority Pass has the three tiers", () => {
    expect(loadPriorityPass().tiers.map((t) => t.tier).sort()).toEqual(["Prestige", "Standard", "Standard Plus"]);
  });
});

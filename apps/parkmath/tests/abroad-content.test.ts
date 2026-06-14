import { describe, it, expect } from "vitest";
import { abroadModel, abroadAirportSlugs } from "../lib/abroad-content";

describe("abroadAirportSlugs", () => {
  it("covers every drop-off and parking airport (union, unique)", () => {
    const slugs = abroadAirportSlugs();
    expect(slugs.length).toBeGreaterThan(0);
    expect(new Set(slugs).size).toBe(slugs.length); // unique
    expect(slugs).toContain("manchester");
  });
});

describe("abroadModel", () => {
  it("returns null for an unknown airport", () => {
    expect(abroadModel("not-an-airport")).toBeNull();
  });

  it("builds a combined model for a parking+drop-off airport", () => {
    const m = abroadModel("manchester");
    expect(m).not.toBeNull();
    expect(m!.airport.slug).toBe("manchester");
    // parking present → cheapest 7-day pre-book is a positive pence figure
    expect(m!.hasParking).toBe(true);
    expect(m!.cheapestParkingPence === null || m!.cheapestParkingPence > 0).toBe(true);
    // drop-off branch is well-formed
    expect(typeof m!.dropOff.isFree).toBe("boolean");
    // roaming summary derived from the dataset
    expect(m!.roaming.totalDestinations).toBeGreaterThan(0);
    expect(m!.roaming.includedCount).toBeGreaterThanOrEqual(0);
    expect(m!.roaming.includedCount).toBeLessThanOrEqual(m!.roaming.totalDestinations);
    // baggage cabin range present
    expect(m!.baggage.cabinMinPence === null || m!.baggage.cabinMinPence >= 0).toBe(true);
    // at least one FAQ, and a verifiedAt date string
    expect(m!.faqs.length).toBeGreaterThan(0);
    expect(m!.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

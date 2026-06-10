import { describe, expect, it } from "vitest";
import type { DropOffRecord } from "@mathfamily/data";
import { buildDropOffFaqs, isPerEntryTariff, trendNote } from "../lib/content";

const record: DropOffRecord = {
  airportSlug: "gatwick",
  isFree: false,
  feeSummary: "£10 for up to 20 minutes",
  bands: [{ upToMinutes: 20, totalPence: 1000 }],
  maxStayMinutes: 20,
  perMinuteAfterPence: null,
  maxChargePence: null,
  penaltyPence: 10000,
  penaltyNotes: "Reduced to £50 if paid within 14 days",
  paymentDeadline: "23:59 the day after drop-off",
  blueBadgePolicy: "Exempt if registered in advance",
  freeAlternative: { name: "Long Stay car park", minutesFree: 30, details: "Shuttle to terminal" },
  priorYearFeePence: 700,
  sourceUrl: "https://www.gatwickairport.com/drop-off",
  verifiedAt: "2026-06-10"
};

describe("buildDropOffFaqs", () => {
  it("always includes the how-much question", () => {
    const faqs = buildDropOffFaqs(record, "London Gatwick");
    expect(faqs[0]?.question).toBe("How much is the drop-off charge at London Gatwick?");
    expect(faqs[0]?.answer).toContain("£10");
  });
  it("includes pay-after, blue badge and avoid questions when data exists", () => {
    const questions = buildDropOffFaqs(record, "London Gatwick").map((f) => f.question);
    expect(questions).toHaveLength(4);
    expect(questions.some((q) => q.includes("after"))).toBe(true);
    expect(questions.some((q) => q.includes("Blue Badge"))).toBe(true);
    expect(questions.some((q) => q.includes("avoid"))).toBe(true);
  });
  it("omits optional questions when data is null", () => {
    const sparse = { ...record, paymentDeadline: null, freeAlternative: null };
    expect(buildDropOffFaqs(sparse, "X")).toHaveLength(2);
  });
});

describe("trendNote", () => {
  it("describes a rise vs prior year", () => {
    expect(trendNote(record)).toBe("Up £3 vs 2025 (£7 → £10)");
  });
  it("returns null without prior-year data", () => {
    expect(trendNote({ ...record, priorYearFeePence: null })).toBeNull();
  });
  it("returns null for free airports", () => {
    expect(trendNote({ ...record, isFree: true, bands: [] })).toBeNull();
  });
  it("frames a brand-new charge (prior year was free) without an up/down delta", () => {
    const newCharge = { ...record, priorYearFeePence: 0, bands: [{ upToMinutes: 5, totalPence: 800 }] };
    expect(trendNote(newCharge)).toBe("New charge for 2026 (£8)");
  });
});

describe("isPerEntryTariff", () => {
  it("true for a flat per-entry record (nominal 1-minute band)", () => {
    expect(isPerEntryTariff({ ...record, bands: [{ upToMinutes: 1, totalPence: 700 }] })).toBe(true);
  });
  it("false for duration-banded and free records", () => {
    expect(isPerEntryTariff(record)).toBe(false);
    expect(isPerEntryTariff({ ...record, isFree: true, bands: [] })).toBe(false);
  });
});

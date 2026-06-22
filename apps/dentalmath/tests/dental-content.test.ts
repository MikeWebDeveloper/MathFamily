import { describe, expect, it } from "vitest";
import { compareTreatment, formatRange, buildTreatmentFaqs } from "../lib/dental-content";
import type { PriceRange, TreatmentRecord } from "../lib/dental-data";

const fillingLike: TreatmentRecord = {
  slug: "test-filling",
  name: "Filling",
  summary: "Repairing a tooth.",
  nhsBand: "band2",
  privatePrice: { minPence: 9000, maxPence: 25000 },
  privateNote: "Composite costs more.",
  privateSource: { label: "Guide", sourceUrl: "https://example.com", verifiedAt: "2026-06-22" }
};

describe("formatRange", () => {
  it("renders a min-max range", () => {
    expect(formatRange({ minPence: 9000, maxPence: 25000 } as PriceRange)).toBe("£90–£250");
  });
  it("collapses an equal range to a single figure", () => {
    expect(formatRange({ minPence: 5000, maxPence: 5000 } as PriceRange)).toBe("£50");
  });
});

describe("compareTreatment", () => {
  it("uses the England Band 2 charge for a filling", () => {
    const c = compareTreatment(fillingLike);
    expect(c.band.band).toBe("band2");
    expect(c.nhsPence).toBe(7660); // £76.60
  });

  it("computes the saving as private midpoint minus the NHS charge", () => {
    const c = compareTreatment(fillingLike);
    // midpoint of 9000..25000 = 17000; saving = 17000 - 7660 = 9340
    expect(c.privateMidPence).toBe(17000);
    expect(c.savingPence).toBe(9340);
  });

  it("never reports a negative saving", () => {
    const cheapPrivate: TreatmentRecord = {
      ...fillingLike,
      privatePrice: { minPence: 1000, maxPence: 2000 }
    };
    const c = compareTreatment(cheapPrivate);
    expect(c.savingPence).toBe(0);
  });

  it("produces an answer mentioning both NHS and private cost", () => {
    const c = compareTreatment(fillingLike);
    expect(c.answer).toContain("£76.60");
    expect(c.answer).toContain("£90–£250");
  });
});

describe("buildTreatmentFaqs", () => {
  it("returns NHS, private and worth-it questions", () => {
    const faqs = buildTreatmentFaqs(fillingLike);
    expect(faqs).toHaveLength(3);
    expect(faqs[0]!.answer).toContain("£76.60");
    expect(faqs[1]!.answer).toContain("£90–£250");
  });
});

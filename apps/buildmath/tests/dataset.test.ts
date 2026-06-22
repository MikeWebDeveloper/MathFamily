import { describe, expect, it } from "vitest";
import { DATASET } from "../lib/data/dataset";
import { projectAnswer, buildProjectFaqs } from "../lib/content";
import { resolveSlot } from "../lib/partners";

describe("dataset integrity", () => {
  it("has between 5 and 10 project types (MVP spoke range)", () => {
    expect(DATASET.projectTypes.length).toBeGreaterThanOrEqual(5);
    expect(DATASET.projectTypes.length).toBeLessThanOrEqual(10);
  });

  it("every project carries a source URL + verified date and a sane range", () => {
    for (const p of DATASET.projectTypes) {
      expect(p.source.sourceUrl).toMatch(/^https?:\/\//);
      expect(p.source.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isInteger(p.baseLowPence)).toBe(true);
      expect(Number.isInteger(p.baseHighPence)).toBe(true);
      expect(p.baseLowPence).toBeGreaterThan(0);
      expect(p.baseHighPence).toBeGreaterThanOrEqual(p.baseLowPence);
    }
  });

  it("every region carries a positive cost index and a source", () => {
    for (const r of DATASET.regions) {
      expect(r.costIndex).toBeGreaterThan(0);
      expect(r.source.sourceUrl).toMatch(/^https?:\/\//);
      expect(r.source.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("perSqm rates are realistic (£20–£3,000/m²) and whole-job totals are >= £1,000", () => {
    for (const p of DATASET.projectTypes) {
      if (p.pricing === "perSqm") {
        // pence/m²: £20 = 2_000 ; £3,000 = 300_000
        expect(p.baseLowPence).toBeGreaterThanOrEqual(2_000);
        expect(p.baseHighPence).toBeLessThanOrEqual(300_000);
      } else {
        expect(p.baseLowPence).toBeGreaterThanOrEqual(1_000_00);
      }
    }
  });
});

describe("content models", () => {
  it("projectAnswer returns a non-empty sentence mentioning the project", () => {
    for (const p of DATASET.projectTypes) {
      const a = projectAnswer(p);
      expect(a.length).toBeGreaterThan(20);
      expect(a.toLowerCase()).toContain(p.name.toLowerCase());
    }
  });

  it("buildProjectFaqs returns at least 3 Q&A items", () => {
    for (const p of DATASET.projectTypes) {
      const faqs = buildProjectFaqs(p);
      expect(faqs.length).toBeGreaterThanOrEqual(3);
      for (const f of faqs) {
        expect(f.question.length).toBeGreaterThan(5);
        expect(f.answer.length).toBeGreaterThan(10);
      }
    }
  });
});

describe("affiliate slot is inert (compliance)", () => {
  it("resolveSlot returns an inert slot with no URL while all partners are inactive", () => {
    const slot = resolveSlot("single-storey-extension");
    expect(slot.kind).toBe("inert");
    expect(slot.url).toBeNull();
    expect(slot.disclosureRequired).toBe(false);
  });
});

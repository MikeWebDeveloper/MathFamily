import { describe, expect, it } from "vitest";
import { PLANS } from "../lib/broadband-data";
import { planCostModel, buildPlanFaqs } from "../lib/broadband-content";

const plan = PLANS.find((p) => p.slug === "bt-fibre-2")!;

describe("planCostModel", () => {
  it("produces an answer naming the provider and the real cost", () => {
    const m = planCostModel(plan);
    expect(m.answer).toContain(plan.provider);
    expect(m.answer.toLowerCase()).toContain("month");
  });

  it("the effective monthly cost is at least the advertised price when there is a rise", () => {
    const m = planCostModel(plan);
    expect(m.contract.effectiveMonthlyPence).toBeGreaterThanOrEqual(plan.advertisedMonthlyPence);
  });
});

describe("buildPlanFaqs", () => {
  it("includes a true-cost question, a price-rise question and an out-of-contract question", () => {
    const faqs = buildPlanFaqs(plan);
    expect(faqs.length).toBeGreaterThanOrEqual(3);
    expect(faqs.some((f) => f.question.toLowerCase().includes("really cost"))).toBe(true);
    expect(faqs.some((f) => f.question.toLowerCase().includes("mid-contract"))).toBe(true);
    expect(faqs.some((f) => f.question.toLowerCase().includes("contract ends"))).toBe(true);
  });
});

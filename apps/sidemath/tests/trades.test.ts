import { describe, expect, it } from "vitest";
import { TRADES, getTrade } from "../lib/trades";
import { calculateTax } from "../lib/calc";

describe("trades dataset", () => {
  it("has 5–8 spokes with unique slugs", () => {
    expect(TRADES.length).toBeGreaterThanOrEqual(5);
    expect(TRADES.length).toBeLessThanOrEqual(8);
    const slugs = new Set(TRADES.map((t) => t.slug));
    expect(slugs.size).toBe(TRADES.length);
  });

  it("every trade has a plausible positive income/expense profile", () => {
    for (const t of TRADES) {
      expect(t.typicalGrossPence).toBeGreaterThan(0);
      expect(t.typicalExpensesPence).toBeGreaterThanOrEqual(0);
      expect(t.typicalExpensesPence).toBeLessThan(t.typicalGrossPence);
      expect(t.commonExpenses.length).toBeGreaterThan(0);
      expect(t.allowanceNote.length).toBeGreaterThan(0);
    }
  });

  it("getTrade resolves a known slug and rejects an unknown one", () => {
    expect(getTrade("courier")?.name).toContain("Courier");
    expect(getTrade("not-a-trade")).toBeNull();
  });

  it("each trade's typical profile produces a sane tax estimate", () => {
    for (const t of TRADES) {
      const b = calculateTax({
        grossPence: t.typicalGrossPence,
        expensesPence: t.typicalExpensesPence,
        useTradingAllowance: false
      });
      expect(b.takeHomePence).toBeLessThanOrEqual(b.profitPence);
      expect(b.totalTaxPence).toBeGreaterThanOrEqual(0);
    }
  });
});

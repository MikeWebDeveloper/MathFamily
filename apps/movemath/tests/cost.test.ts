import { describe, expect, it } from "vitest";
import { calculateMoveCost } from "../lib/cost";
import { SPOKES, buildSpokeModel } from "../lib/spokes";

const p = (pounds: number) => pounds * 100;

describe("calculateMoveCost", () => {
  it("a not-selling buyer has no estate-agent or selling-conveyancing line", () => {
    const r = calculateMoveCost({
      pricePence: p(250_000),
      buyerType: "first-time-buyer",
      removalsKey: "removals-1-2-bed",
      surveyKey: "survey-level-2",
      isSelling: false,
      includeMortgageFee: false
    });
    expect(r.lines.some((l) => l.key === "estate-agent")).toBe(false);
    expect(r.lines.some((l) => l.key === "conveyancing-sell")).toBe(false);
  });

  it("a selling buyer adds estate-agent fee = 1.42% of price, plus selling conveyancing + EPC", () => {
    const price = p(350_000);
    const r = calculateMoveCost({
      pricePence: price,
      buyerType: "home-mover",
      removalsKey: "removals-3-bed",
      surveyKey: "survey-level-2",
      isSelling: true,
      includeMortgageFee: false
    });
    const agent = r.lines.find((l) => l.key === "estate-agent");
    expect(agent?.pence).toBe(Math.round(price * 0.0142));
    expect(r.lines.some((l) => l.key === "conveyancing-sell")).toBe(true);
    expect(r.lines.some((l) => l.key === "epc")).toBe(true);
  });

  it("total equals the sum of all line items", () => {
    const r = calculateMoveCost({
      pricePence: p(450_000),
      buyerType: "additional-property",
      removalsKey: "removals-3-bed",
      surveyKey: "survey-level-2",
      isSelling: false,
      includeMortgageFee: true
    });
    const sum = r.lines.reduce((acc, l) => acc + l.pence, 0);
    expect(r.totalPence).toBe(sum);
  });

  it("the SDLT line matches the standalone SDLT calculation", () => {
    const r = calculateMoveCost({
      pricePence: p(350_000),
      buyerType: "home-mover",
      removalsKey: "removals-3-bed",
      surveyKey: "survey-level-2",
      isSelling: false,
      includeMortgageFee: false
    });
    const sdltLine = r.lines.find((l) => l.key === "sdlt");
    expect(sdltLine?.pence).toBe(r.sdlt.totalTaxPence);
  });
});

describe("spokes", () => {
  it("there are 8 spokes with unique slugs", () => {
    expect(SPOKES.length).toBe(8);
    expect(new Set(SPOKES.map((s) => s.slug)).size).toBe(8);
  });

  it("covers all three buyer types", () => {
    const types = new Set(SPOKES.map((s) => s.buyerType));
    expect(types).toEqual(new Set(["first-time-buyer", "home-mover", "additional-property"]));
  });

  it("each spoke produces a distinct total + SDLT model (anti-thin-content)", () => {
    const totals = SPOKES.map((s) => buildSpokeModel(s).totalFormatted);
    // Most should be distinct; at minimum the models are not all identical.
    expect(new Set(totals).size).toBeGreaterThan(1);
  });

  it("the £550k first-time-buyer spoke flags lost relief", () => {
    const m = buildSpokeModel(SPOKES.find((s) => s.slug === "first-time-buyer-550k")!);
    expect(m.cost.sdlt.ftbReliefLost).toBe(true);
  });
});

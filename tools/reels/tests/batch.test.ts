import { describe, it, expect } from "vitest";
import { buildWeeklyBatch } from "../src/batch";
import { ReelScriptSchema } from "../src/schema";

// Runs over the live datasets; assertions hold regardless of which airports have data.
describe("buildWeeklyBatch", () => {
  it("produces governed, schema-valid scripts", () => {
    const out = buildWeeklyBatch(5);
    expect(out.length).toBeGreaterThan(0);
    for (const s of out) expect(() => ReelScriptSchema.parse(s)).not.toThrow();
  });

  it("never emits an excluded slug (cross-run dedupe)", () => {
    const baseline = buildWeeklyBatch(5).map((s) => s.slug);
    const exclude = new Set(baseline);
    const next = buildWeeklyBatch(5, exclude);
    for (const s of next) expect(exclude.has(s.slug)).toBe(false);
  });
});

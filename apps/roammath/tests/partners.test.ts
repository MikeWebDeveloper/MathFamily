import { describe, expect, it } from "vitest";
import { resolveSlot } from "../lib/partners";

describe("resolveSlot", () => {
  it("falls back to the official provider page while inactive", () => {
    const r = resolveSlot("esim", "spain", "https://www.airalo.com/spain-esim");
    expect(r.kind).toBe("official");
    expect(r.disclosureRequired).toBe(false);
  });
});

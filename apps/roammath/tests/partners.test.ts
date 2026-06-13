import { describe, expect, it } from "vitest";
import { resolveSlot } from "../lib/partners";

describe("resolveSlot", () => {
  it("falls back to the official provider page while inactive", () => {
    const r = resolveSlot("esim", "spain", "https://www.airalo.com/spain-esim");
    expect(r.kind).toBe("official");
    expect(r.disclosureRequired).toBe(false);
  });
});

describe("resolveSlot esim", () => {
  it("falls back to official (non-affiliate) while the slot is inactive", () => {
    const r = resolveSlot("esim", "france", "https://www.airalo.com/france-esim");
    expect(r.kind).toBe("official");
    expect(r.disclosureRequired).toBe(false);
  });
});

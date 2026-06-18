import { describe, expect, it } from "vitest";
import { resolveProvider } from "../lib/partners";

describe("resolveProvider", () => {
  it("falls back to the official provider page while inactive", () => {
    const r = resolveProvider("airalo", "spain", "esim", "https://www.airalo.com/spain-esim");
    expect(r.kind).toBe("official");
    expect(r.disclosureRequired).toBe(false);
  });
});

describe("resolveProvider airalo", () => {
  it("falls back to official (non-affiliate) while the provider is inactive", () => {
    const r = resolveProvider("airalo", "france", "esim", "https://www.airalo.com/france-esim");
    expect(r.kind).toBe("official");
    expect(r.disclosureRequired).toBe(false);
  });
});

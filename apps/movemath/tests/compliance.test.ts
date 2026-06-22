import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolveSlot, allGreenSlotsInert, type GreenCategory } from "../lib/partners";
import { MORTGAGE_RAIL_ACTIVE } from "../components/mortgage-slot";

const GREEN: GreenCategory[] = ["removals", "conveyancing", "surveys"];

describe("MORTGAGE slot — FCA-red, inert (the hard rule)", () => {
  it("the mortgage rail is NOT active", () => {
    expect(MORTGAGE_RAIL_ACTIVE).toBe(false);
  });

  it("the mortgage-slot component carries the FCA-red pre-clear gate comment", () => {
    const src = readFileSync(
      fileURLToPath(new URL("../components/mortgage-slot.tsx", import.meta.url)),
      "utf8"
    );
    expect(src).toContain("FCA-RED: requires Head of Legal introducer pre-clear before any activation");
  });

  it("the mortgage slot has no affiliate URL, broker link, or lead form", () => {
    const src = readFileSync(
      fileURLToPath(new URL("../components/mortgage-slot.tsx", import.meta.url)),
      "utf8"
    );
    // No outbound link and no form element in the inert mortgage slot.
    expect(src).not.toMatch(/<a\s/);
    expect(src).not.toMatch(/<form/);
  });

  it("no GreenCategory is 'mortgage' / 'insurance' — FCA-red products are not green rails", () => {
    expect(GREEN).not.toContain("mortgage" as unknown as GreenCategory);
    expect(GREEN).not.toContain("insurance" as unknown as GreenCategory);
  });
});

describe("GREEN affiliate slots — present but INERT", () => {
  it("every green category resolves to 'coming-soon' (no live merchant IDs)", () => {
    for (const category of GREEN) {
      const slot = resolveSlot(category, "test");
      expect(slot.kind).toBe("coming-soon");
      expect(slot.url).toBeNull();
      expect(slot.disclosureRequired).toBe(false);
    }
  });

  it("allGreenSlotsInert() is true — no rail is live", () => {
    expect(allGreenSlotsInert()).toBe(true);
  });
});

describe("tax/legal disclaimer is present and prominent", () => {
  it("the AdviceDisclaimer component states it is not financial, tax or legal advice", () => {
    const src = readFileSync(
      fileURLToPath(new URL("../components/disclaimer.tsx", import.meta.url)),
      "utf8"
    );
    expect(src.toLowerCase()).toContain("not financial, tax or legal advice");
    expect(src).toContain("gov.uk");
  });
});

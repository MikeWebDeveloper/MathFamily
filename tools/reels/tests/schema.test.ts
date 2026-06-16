import { describe, it, expect } from "vitest";
import { ReelScriptSchema, type ReelScript } from "../src/schema";

const valid: ReelScript = {
  version: "1",
  brand: "parkmath",
  format: "shock-fee",
  slug: "stansted",
  figures: [{ id: "fee", label: "Drop-off fee", pence: 700 }],
  scenes: [
    { kind: "intro", onScreenText: "Drop-off rip-off", figureIds: [], durationHintMs: 1500 },
    { kind: "stat", onScreenText: "£7", figureIds: ["fee"], durationHintMs: 2500 },
    { kind: "cta", onScreenText: "parkmath.co.uk", figureIds: [], durationHintMs: 1500 }
  ],
  narration: "It costs seven pounds just to drop someone off at Stansted. Full list at parkmath.co.uk.",
  captions: ["£7 to drop off at Stansted", "Full list at parkmath.co.uk"],
  cta: "Full list at parkmath.co.uk",
  sourceUrl: "https://www.stanstedairport.com/x",
  verifiedAt: "2026-06-14"
};

describe("ReelScriptSchema", () => {
  it("accepts a valid script", () => {
    expect(ReelScriptSchema.parse(valid)).toEqual(valid);
  });
  it("rejects an affiliate/awin URL anywhere in the spoken/visible copy", () => {
    const bad = { ...valid, narration: valid.narration + " https://www.awin1.com/cread.php?awinmid=3496" };
    expect(() => ReelScriptSchema.parse(bad)).toThrow(/affiliate/i);
  });
  it("requires the brand domain to appear in narration or cta", () => {
    const bad = { ...valid, narration: "It costs seven pounds.", cta: "See more" };
    expect(() => ReelScriptSchema.parse(bad)).toThrow(/parkmath\.co\.uk/);
  });
  it("rejects non-integer pence", () => {
    const bad = { ...valid, figures: [{ id: "fee", label: "Fee", pence: 7.5 }] };
    expect(() => ReelScriptSchema.parse(bad)).toThrow();
  });
  it("rejects a scene referencing an unknown figure id", () => {
    const bad = { ...valid, scenes: [...valid.scenes, { kind: "stat", onScreenText: "x", figureIds: ["nope"], durationHintMs: 1000 }] };
    expect(() => ReelScriptSchema.parse(bad)).toThrow(/figureIds/);
  });
});

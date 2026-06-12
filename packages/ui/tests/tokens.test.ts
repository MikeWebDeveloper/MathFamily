import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const css = readFileSync(fileURLToPath(new URL("../src/tokens.css", import.meta.url)), "utf8");

describe("fluid type-scale tokens", () => {
  it("defines a clamp() token + line-height for every scale step", () => {
    for (const name of ["display", "stat", "h1", "h2", "lead"]) {
      expect(css, name).toMatch(new RegExp(`--text-${name}:\\s*clamp\\(`));
      expect(css, `${name} line-height`).toContain(`--text-${name}--line-height`);
    }
  });
  it("adds a display-size numeric utility without touching base .mf-num tracking", () => {
    expect(css).toContain(".mf-num-display");
    // base .mf-num must keep 0 letter-spacing (tables rely on it): no letter-spacing inside the .mf-num{} block
    const mfNumBlock = css.match(/\.mf-num\s*\{[^}]*\}/);
    expect(mfNumBlock).not.toBeNull();
    expect(mfNumBlock![0]).not.toContain("letter-spacing");
  });
});

it("defines a single-glow winner utility distinct from the static winner ring", () => {
  expect(css).toContain(".mf-glow-winner");
  expect(css).toMatch(/--shadow-card|--shadow-raised|--shadow-hero/);
});

it("defines a reduced-motion-safe skeleton shimmer", () => {
  expect(css).toContain(".mf-skeleton");
});

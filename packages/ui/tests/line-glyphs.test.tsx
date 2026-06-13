// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { PlaneGlyph, TowerGlyph, LuggageGlyph, GlobeGlyph, ChevronGlyph } from "../src/line-glyphs";

afterEach(cleanup);

describe("line-glyph icons", () => {
  it("each renders a decorative aria-hidden svg using currentColor", () => {
    for (const G of [PlaneGlyph, TowerGlyph, LuggageGlyph, GlobeGlyph, ChevronGlyph]) {
      const { container, unmount } = render(<G />);
      const svg = container.querySelector("svg")!;
      expect(svg.getAttribute("aria-hidden")).toBe("true");
      expect(container.querySelector('[stroke="currentColor"]')).not.toBeNull();
      unmount();
    }
  });
});

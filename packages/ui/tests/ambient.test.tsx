// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { AmbientBackdrop } from "../src/ambient-backdrop";
import { RunwayDivider } from "../src/line-glyphs";
import { FeeGrid } from "../src/fee-grid";

afterEach(cleanup);

describe("AmbientBackdrop", () => {
  it("renders grid + two blobs, aria-hidden, pointer-events none", () => {
    const { container } = render(<AmbientBackdrop />);
    const root = container.firstElementChild!;
    expect(root.getAttribute("aria-hidden")).toBe("true");
    expect(root.className).toContain("pointer-events-none");
    expect(container.querySelector(".mf-grid-bg")).not.toBeNull();
    expect(container.querySelector(".mf-blob")).not.toBeNull();
    expect(container.querySelector(".mf-blob-2")).not.toBeNull();
  });
});

describe("line glyphs", () => {
  it("render decorative svgs", () => {
    const { container } = render(<RunwayDivider />);
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("FeeGrid highlightRow", () => {
  it("marks the winner row", () => {
    const { container } = render(
      <FeeGrid columns={["Option", "7 days"]} rows={[["Meet & Greet", "£90"], ["Long Stay", "£55"]]} highlightRow={1} />
    );
    const rows = container.querySelectorAll("tbody tr");
    expect(rows[1]!.className).toContain("mf-winner-row");
    expect(rows[0]!.className).not.toContain("mf-winner-row");
  });
});

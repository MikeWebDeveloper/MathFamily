// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { NavTile, NavTileGrid } from "../src/nav-tile";

afterEach(cleanup);

describe("NavTile", () => {
  it("primary renders a crawlable link carrying the glint sweep", () => {
    const { container } = render(
      <NavTile href="/airport-parking" title="Airport parking" descriptor="Gate vs pre-book" variant="primary" />,
    );
    const a = container.querySelector("a")!;
    expect(a.getAttribute("href")).toBe("/airport-parking");
    expect(a.className).toContain("mf-glint");
    expect(a.className).toContain("bg-brand");
    expect(container.querySelector(".mf-glint__sweep")).not.toBeNull();
  });
  it("secondary has no glint and supports download", () => {
    const { container } = render(
      <NavTile href="/data/drop-off-charges.csv" title="Open data" variant="secondary" download />,
    );
    const a = container.querySelector("a")!;
    expect(a.className).not.toContain("mf-glint");
    expect(a.hasAttribute("download")).toBe(true);
  });
});

describe("NavTileGrid", () => {
  it("renders one tile per item with a staggered reveal delay", () => {
    const tiles = [
      { href: "/a", title: "A" },
      { href: "/b", title: "B" },
      { href: "/c", title: "C" },
    ];
    const { container } = render(<NavTileGrid tiles={tiles} variant="primary" />);
    expect(container.querySelectorAll("a")).toHaveLength(3);
    const wrappers = container.querySelectorAll(".mf-reveal");
    expect((wrappers[1] as HTMLElement).style.getPropertyValue("--mf-delay")).toBe("40ms");
  });
});

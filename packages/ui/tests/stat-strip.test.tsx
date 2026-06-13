// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { StatStrip } from "../src/stat-strip";

afterEach(cleanup);

it("renders each stat's value (mono) and label in one strip", () => {
  render(<StatStrip stats={[
    { label: "Most expensive", value: "£10", note: "Stansted" },
    { label: "Charging", value: "23", note: "of 25" },
    { label: "Still free", value: "2" },
  ]} />);
  expect(screen.getByText("£10").className).toContain("mf-num");
  expect(screen.getByText("23")).toBeDefined();
  expect(screen.getByText("Still free")).toBeDefined();
});

describe("StatStrip columns", () => {
  it("uses a 4-column grid for 4 stats", () => {
    const stats = [1, 2, 3, 4].map((n) => ({ label: `L${n}`, value: `${n}` }));
    const { container } = render(<StatStrip stats={stats} />);
    expect(container.querySelector(".grid")!.className).toContain("grid-cols-4");
  });
  it("uses a 2-column grid for 2 stats", () => {
    const { container } = render(<StatStrip stats={[{ label: "A", value: "1" }, { label: "B", value: "2" }]} />);
    expect(container.querySelector(".grid")!.className).toContain("grid-cols-2");
  });
});

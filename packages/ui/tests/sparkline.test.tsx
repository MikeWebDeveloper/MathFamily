// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { Sparkline } from "../src/sparkline";
afterEach(cleanup);

it("renders nothing for fewer than two points", () => {
  const { container } = render(<Sparkline data={[700]} />);
  expect(container.querySelector("svg")).toBeNull();
});

it("draws a polyline and an end dot for a rising series, coloured warning", () => {
  const { container } = render(<Sparkline data={[600, 700]} />);
  const line = container.querySelector("polyline");
  const dot = container.querySelector("circle");
  expect(line?.getAttribute("stroke")).toBe("var(--color-warning)");
  expect(dot).not.toBeNull();
  // two points map to two "x,y" pairs
  expect(line?.getAttribute("points")?.trim().split(" ").length).toBe(2);
});

it("colours a falling series positive (a drop is good news)", () => {
  const { container } = render(<Sparkline data={[700, 600]} />);
  expect(container.querySelector("polyline")?.getAttribute("stroke")).toBe("var(--color-positive)");
});

it("renders a flat series muted with no end dot", () => {
  const { container } = render(<Sparkline data={[700, 700]} />);
  expect(container.querySelector("polyline")?.getAttribute("stroke")).toBe("var(--color-ink-muted)");
  expect(container.querySelector("circle")).toBeNull();
});

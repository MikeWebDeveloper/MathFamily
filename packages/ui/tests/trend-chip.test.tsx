// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { TrendChip } from "../src/trend-chip";
afterEach(cleanup);

it("renders nothing for fewer than two points", () => {
  const { container } = render(<TrendChip data={[700]} />);
  expect(container.firstChild).toBeNull();
});

it("shows an up delta in pounds when the price rose", () => {
  render(<TrendChip data={[600, 700]} baseLabel="vs 2025" />);
  // £1 rise, with the up arrow and base label
  expect(screen.getByText(/\+£1/)).toBeTruthy();
  expect(screen.getByText("↑")).toBeTruthy();
  expect(screen.getByText("vs 2025")).toBeTruthy();
});

it("shows a down delta with a minus sign when the price fell", () => {
  render(<TrendChip data={[700, 600]} />);
  expect(screen.getByText(/−£1/)).toBeTruthy();
  expect(screen.getByText("↓")).toBeTruthy();
});

it("shows Held when unchanged", () => {
  render(<TrendChip data={[700, 700]} baseLabel="vs 2025" />);
  expect(screen.getByText(/Held vs 2025/)).toBeTruthy();
});

it("formats sub-pound and multi-pound magnitudes", () => {
  const { rerender } = render(<TrendChip data={[700, 750]} />);
  expect(screen.getByText(/\+£0\.50/)).toBeTruthy();
  rerender(<TrendChip data={[500, 1000]} />);
  expect(screen.getByText(/\+£5/)).toBeTruthy();
});

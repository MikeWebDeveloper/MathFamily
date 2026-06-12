// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { RangeSlider } from "../src/range-slider";

afterEach(cleanup);

it("renders an accessible range input with the glow classes and fires onChange", () => {
  const onChange = vi.fn();
  render(<RangeSlider min={1} max={20} value={3} onChange={onChange} ariaLabel="Visits" ariaValuetext="3 visits" />);
  const input = screen.getByRole("slider", { name: "Visits" });
  expect(input.getAttribute("aria-valuetext")).toBe("3 visits");
  expect(input.className).toContain("accent-brand-accent");
  expect(input.className).toContain("focus-visible:shadow");
  fireEvent.change(input, { target: { value: "7" } });
  expect(onChange).toHaveBeenCalledWith(7);
});

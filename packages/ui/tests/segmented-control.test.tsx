// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SegmentedControl } from "../src/segmented-control";
afterEach(cleanup);
it("renders options and calls onChange on select", () => {
  const onChange = vi.fn();
  render(<SegmentedControl ariaLabel="Sort" value="fee" onChange={onChange} options={[{ value: "fee", label: "Most expensive" }, { value: "az", label: "A–Z" }]} />);
  expect(screen.getByRole("radio", { name: "Most expensive" }).getAttribute("aria-checked")).toBe("true");
  fireEvent.click(screen.getByRole("radio", { name: "A–Z" }));
  expect(onChange).toHaveBeenCalledWith("az");
});

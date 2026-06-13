// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { SegmentedControl } from "../src/segmented-control";

afterEach(cleanup);

describe("SegmentedControl a11y", () => {
  it("option buttons are 44px and have a focus-visible ring", () => {
    const { container } = render(
      <SegmentedControl
        ariaLabel="Sort"
        value="a"
        onChange={() => {}}
        options={[{ value: "a", label: "A" }, { value: "b", label: "B" }]}
      />,
    );
    const btn = container.querySelector('button[role="radio"]')!;
    expect(btn.className).toContain("min-h-11");
    expect(btn.className).toContain("focus-visible:ring-2");
    expect(btn.className).not.toContain("min-h-9");
  });
});

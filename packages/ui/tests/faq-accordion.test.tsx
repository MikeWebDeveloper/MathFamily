// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { FaqAccordion } from "../src/faq-accordion";

afterEach(cleanup);

describe("FaqAccordion", () => {
  it("renders native details/summary with a visible focus ring and the answer", () => {
    const { container, getByText } = render(
      <FaqAccordion items={[{ question: "How much?", answer: "Six pounds." }]} />,
    );
    const summary = container.querySelector("summary")!;
    expect(summary).not.toBeNull();
    expect(summary.className).toContain("focus-visible:ring-2");
    expect(getByText("Six pounds.")).toBeTruthy();
  });
});

// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { SavesVerdict } from "../src/saves-verdict";

afterEach(cleanup);

it("renders the saved amount in mono and the verdict sentence", () => {
  render(<SavesVerdict amount="£37" verdict="Pre-book — it's cheaper for a 7-day stay." />);
  expect(screen.getByText("£37").className).toContain("mf-num");
  expect(screen.getByText(/Pre-book/)).toBeDefined();
});

it("renders verdict only when there is no saving", () => {
  const { container } = render(<SavesVerdict verdict="Your network already includes this trip." />);
  expect(container.textContent).toContain("already includes");
  expect(container.querySelector(".mf-num")).toBeNull();
});

// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { IataTile } from "../src/iata-tile";
afterEach(cleanup);
it("renders the 3-letter code as a mono monogram tile", () => {
  render(<IataTile code="LHR" />);
  const t = screen.getByText("LHR");
  expect(t.className).toContain("mf-num");
  expect(t.getAttribute("aria-hidden")).toBe("true");
});

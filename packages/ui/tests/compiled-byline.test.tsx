// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { CompiledByline } from "../src/compiled-byline";

afterEach(cleanup);

it("renders the compiler name and verified date", () => {
  render(<CompiledByline name="Michal Latal" verifiedAt="2026-06-14" />);
  expect(screen.getByText(/Michal Latal/)).toBeTruthy();
  expect(screen.getByText(/2026-06-14/)).toBeTruthy();
});
it("renders without a date", () => {
  render(<CompiledByline name="Michal Latal" />);
  expect(screen.getByText(/Michal Latal/)).toBeTruthy();
});

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

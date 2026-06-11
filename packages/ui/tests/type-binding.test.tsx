// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { AnswerCard } from "../src/answer-card";
import { FeeStat } from "../src/fee-stat";
import { AnswerLead } from "../src/answer-lead";

afterEach(cleanup);

it("AnswerCard value uses the fluid display token (not text-6xl)", () => {
  render(<AnswerCard label="X" value="£7" />);
  const v = screen.getByText("£7");
  expect(v.className).toContain("text-display");
  expect(v.className).toContain("mf-num-display");
  expect(v.className).not.toContain("text-6xl");
});

it("FeeStat value uses the fluid stat token", () => {
  render(<FeeStat label="X" value="23" />);
  const v = screen.getByText("23");
  expect(v.className).toContain("text-stat");
  expect(v.className).not.toContain("text-5xl");
});

it("AnswerLead answer uses the fluid lead token", () => {
  render(<AnswerLead answer="It costs £7." />);
  const a = screen.getByText("It costs £7.");
  expect(a.className).toContain("text-lead");
  expect(a.className).not.toContain("text-xl");
});

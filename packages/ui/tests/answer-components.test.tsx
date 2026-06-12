// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { AnswerCard } from "../src/answer-card";
import { VerifiedStamp } from "../src/verified-stamp";
import { CaveatChip } from "../src/caveat-chip";

afterEach(cleanup);

describe("AnswerCard", () => {
  it("renders label, big value, note and the anchor id for the mini bar", () => {
    const { container } = render(<AnswerCard label="Drop-off charge" value="£7" note="for 10 minutes" />);
    expect(screen.getByText("£7")).toBeDefined();
    expect(screen.getByText("for 10 minutes")).toBeDefined();
    expect(container.querySelector("#mf-answer-anchor")).not.toBeNull();
    expect(container.querySelector(".mf-edge-shine")).not.toBeNull();
  });

  it("AnswerCard renders a static value by default and a counted value when pence is given", () => {
    const { rerender } = render(<AnswerCard label="X" value="£7" />);
    expect(screen.getByText("£7")).toBeDefined();
    rerender(<AnswerCard label="X" value="£7" pence={700} render={(p) => (p === null ? "—" : `£${(p/100).toFixed(0)}`)} />);
    expect(screen.getByText("£7")).toBeDefined();
  });
});

describe("VerifiedStamp", () => {
  it("renders the date and the source link inside a details element", () => {
    render(<VerifiedStamp verifiedAt="2026-06-10" sourceUrl="https://example.com/x" sourceLabel="Official page" />);
    expect(screen.getByText(/10 Jun 2026/)).toBeDefined();
    const link = screen.getByRole("link", { name: /Official page/ });
    expect(link.getAttribute("href")).toBe("https://example.com/x");
  });
});

describe("CaveatChip", () => {
  it("renders its caveat text", () => {
    render(<CaveatChip>Max stay 15 min</CaveatChip>);
    expect(screen.getByText("Max stay 15 min")).toBeDefined();
  });
});

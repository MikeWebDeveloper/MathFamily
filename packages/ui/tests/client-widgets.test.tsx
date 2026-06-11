// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { MiniAnswerBar } from "../src/mini-answer-bar";
import { AnimatedNumber } from "../src/animated-number";

afterEach(cleanup);

describe("MiniAnswerBar", () => {
  it("starts hidden (translated off-screen, aria-hidden)", () => {
    render(<MiniAnswerBar summary="LGW drop-off · £7 / 10 min" verified />);
    const bar = screen.getByTestId("mini-answer-bar");
    expect(bar.getAttribute("aria-hidden")).toBe("true");
    expect(bar.className).toContain("translate-y-full");
    expect(bar.textContent).toContain("LGW drop-off");
    expect(bar.textContent).toContain("verified");
  });
});

describe("AnimatedNumber", () => {
  it("renders the formatted value", () => {
    const fmt = (p: number | null) => (p === null ? "—" : `£${(p / 100).toFixed(2)}`);
    render(<AnimatedNumber pence={700} render={fmt} />);
    expect(screen.getByText("£7.00")).toBeDefined();
  });
  it("settles on the new value after a change", async () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    const fmt = (p: number | null) => (p === null ? "—" : String(p));
    const { rerender } = render(<AnimatedNumber pence={100} render={fmt} />);
    await act(async () => { rerender(<AnimatedNumber pence={250} render={fmt} />); });
    expect(screen.getByText("250")).toBeDefined(); // reduced-motion → instant
    vi.unstubAllGlobals();
  });
});

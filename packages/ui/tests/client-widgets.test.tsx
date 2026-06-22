// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MiniAnswerBar } from "../src/mini-answer-bar";
import { AnimatedNumber } from "../src/animated-number";
import { ChapterDivider } from "../src/chapter-divider";

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

  it("updates its summary when a mf-live-answer event fires", () => {
    render(<MiniAnswerBar summary="LGW · static" verified />);
    const bar = screen.getByTestId("mini-answer-bar");
    expect(bar.textContent).toContain("static");
    fireEvent(window, new CustomEvent("mf-live-answer", { detail: "LGW · £12 / 25 min" }));
    expect(bar.textContent).toContain("£12 / 25 min");
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
  it("accepts a custom dur prop without breaking output (reduced-motion path)", async () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    const fmt = (p: number | null) => (p === null ? "—" : `£${(p / 100).toFixed(2)}`);
    const { rerender } = render(<AnimatedNumber pence={500} render={fmt} dur={500} />);
    await act(async () => { rerender(<AnimatedNumber pence={1000} render={fmt} dur={500} />); });
    // Under reduced-motion the value jumps instantly regardless of dur.
    expect(screen.getByText("£10.00")).toBeDefined();
    vi.unstubAllGlobals();
  });
  it("renders with default dur when dur prop is omitted", () => {
    const fmt = (p: number | null) => (p === null ? "—" : String(p));
    render(<AnimatedNumber pence={42} render={fmt} />);
    expect(screen.getByText("42")).toBeDefined();
  });
});

describe("ChapterDivider", () => {
  it("renders a separator with a visible label", () => {
    render(<ChapterDivider label="Free alternative" />);
    const el = screen.getByRole("separator");
    expect(el.getAttribute("aria-label")).toBe("Free alternative");
    expect(el.textContent).toContain("Free alternative");
  });
  it("renders a plain hairline when no label is provided", () => {
    const { container } = render(<ChapterDivider />);
    const hr = container.querySelector("hr");
    expect(hr).not.toBeNull();
    // aria-hidden keeps it decorative for screen readers.
    expect(hr?.getAttribute("aria-hidden")).toBe("true");
  });
  it("omits a visible text node when label is undefined", () => {
    render(<ChapterDivider />);
    // No separator role — just an hr — so getByRole("separator") should throw.
    expect(screen.queryByRole("separator")).toBeNull();
  });
});

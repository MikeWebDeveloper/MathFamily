// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { LiveRegion } from "../src/live-region";

afterEach(cleanup);

describe("LiveRegion", () => {
  it("polite (default) is an sr-only aria-live=polite region carrying the message", () => {
    const { container } = render(<LiveRegion message="3 airports found near you" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute("aria-live")).toBe("polite");
    expect(el.getAttribute("aria-atomic")).toBe("true");
    expect(el.className).toContain("sr-only");
    expect(el.textContent).toBe("3 airports found near you");
  });
  it("variant='alert' renders role=alert (assertive)", () => {
    const { container } = render(<LiveRegion message="Couldn't get your location" variant="alert" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute("role")).toBe("alert");
  });
  it("renders nothing for an empty message", () => {
    const { container } = render(<LiveRegion message="" />);
    expect(container.firstChild).toBeNull();
  });
});

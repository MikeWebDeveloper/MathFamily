// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { EmailCaptureSlot } from "../src/email-capture-slot";

afterEach(cleanup);

describe("EmailCaptureSlot", () => {
  it("input and submit button expose focus rings", () => {
    const { container } = render(<EmailCaptureSlot formAction="https://example.com/sub" hook="Get alerts" />);
    const input = container.querySelector('input[type="email"]')!;
    const button = container.querySelector('button[type="submit"]')!;
    expect(input.className).toContain("focus:ring-2");
    expect(button.className).toContain("focus-visible:ring-2");
  });
  it("renders nothing without a formAction", () => {
    const { container } = render(<EmailCaptureSlot hook="Get alerts" />);
    expect(container.firstChild).toBeNull();
  });
});

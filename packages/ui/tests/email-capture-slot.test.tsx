// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { EmailCaptureSlot } from "../src/email-capture-slot";

afterEach(cleanup);

describe("EmailCaptureSlot — funnel is the default (the moat)", () => {
  it("ALWAYS renders the form (no formAction needed) — the fail-safe fix", () => {
    const { container } = render(<EmailCaptureSlot brandName="ParkMath" hook="Get alerts" />);
    const form = container.querySelector("form")!;
    expect(form).not.toBeNull();
    // Posts to our own durable-first funnel, not a MailerLite native endpoint.
    expect(form.getAttribute("action")).toBe("/api/subscribe");
    expect(form.getAttribute("method")).toBe("post");
  });

  it("GDPR: an explicit, UN-ticked, required consent checkbox is present", () => {
    const { container } = render(<EmailCaptureSlot brandName="ParkMath" hook="Get alerts" />);
    const consent = container.querySelector('input[name="consent"]') as HTMLInputElement;
    expect(consent).not.toBeNull();
    expect(consent.type).toBe("checkbox");
    expect(consent.required).toBe(true);
    expect(consent.checked).toBe(false); // never pre-ticked
  });

  it("links to the privacy policy", () => {
    const { container } = render(<EmailCaptureSlot brandName="ParkMath" hook="Get alerts" privacyHref="/privacy" />);
    const link = container.querySelector('a[href="/privacy"]')!;
    expect(link).not.toBeNull();
  });

  it("email input and submit expose focus rings (a11y)", () => {
    const { container } = render(<EmailCaptureSlot brandName="ParkMath" hook="Get alerts" />);
    const input = container.querySelector('input[type="email"]')!;
    const button = container.querySelector('button[type="submit"]')!;
    expect(input.className).toContain("focus:ring-2");
    expect(button.className).toContain("focus-visible:ring-2");
  });

  it("derives the consent copy from brandName — NO hardcoded 'ParkMath' for other brands", () => {
    const { container } = render(<EmailCaptureSlot brandName="EnergyMath" hook="Get alerts" />);
    const text = container.textContent ?? "";
    expect(text).toMatch(/EnergyMath/);
    expect(text).not.toMatch(/ParkMath/);
  });

  it("uses the per-brand `description` hook copy in the consent label when provided", () => {
    const { container } = render(
      <EmailCaptureSlot brandName="EnergyMath" description="monthly UK energy price-cap update" hook="Get alerts" />
    );
    expect(container.textContent).toMatch(/monthly UK energy price-cap update/);
  });

  it("carries the `source` surface tag as a hidden field for the no-JS POST", () => {
    const { container } = render(<EmailCaptureSlot brandName="RoamMath" source="home" hook="Get alerts" />);
    const hidden = container.querySelector('input[type="hidden"][name="source"]') as HTMLInputElement;
    expect(hidden).not.toBeNull();
    expect(hidden.value).toBe("home");
  });
});

describe("EmailCaptureSlot — legacy formAction (DEPRECATED, kept working)", () => {
  it("legacy mode: an explicit formAction keeps the old native form (other apps untouched)", () => {
    const { container } = render(<EmailCaptureSlot hook="Get alerts" formAction="https://legacy" />);
    const form = container.querySelector("form")!;
    expect(form.getAttribute("action")).toBe("https://legacy");
    // legacy mode has no GDPR funnel checkbox
    expect(container.querySelector('input[name="consent"]')).toBeNull();
  });

  it("legacy mode with empty formAction renders nothing (historical contract)", () => {
    const { container } = render(<EmailCaptureSlot hook="Get alerts" formAction="" />);
    expect(container.firstChild).toBeNull();
  });
});

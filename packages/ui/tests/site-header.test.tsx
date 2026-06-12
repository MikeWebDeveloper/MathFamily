// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SiteHeader } from "../src/site-header";

afterEach(cleanup);

const LINKS = [
  { label: "Drop-off charges", href: "/drop-off-charges" },
  { label: "Parking", href: "/airport-parking" },
];

describe("SiteHeader responsive nav", () => {
  it("renders the inline nav as hidden-until-sm", () => {
    const { container } = render(<SiteHeader brandName="ParkMath" brandPrefix="Park" links={LINKS} />);
    const inlineNav = container.querySelector('nav[aria-label="Main"]');
    expect(inlineNav).not.toBeNull();
    expect(inlineNav!.className).toContain("hidden");
    expect(inlineNav!.className).toContain("sm:flex");
  });

  it("exposes a mobile disclosure button (≥44px hit area) that toggles a menu", () => {
    render(<SiteHeader brandName="ParkMath" brandPrefix="Park" links={LINKS} />);
    const btn = screen.getByRole("button", { name: /menu/i });
    expect(btn.className).toContain("sm:hidden");
    expect(btn.className).toContain("min-h-11");
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("navigation", { name: "Mobile" })).toBeNull();
    fireEvent.click(btn);
    expect(btn.getAttribute("aria-expanded")).toBe("true");
    const mobileNav = screen.getByRole("navigation", { name: "Mobile" });
    // every mobile link is a ≥44px row
    mobileNav.querySelectorAll("a").forEach((a) => expect(a.className).toContain("min-h-11"));
  });

  it("still renders the BrandLogo lockup and keeps the wordmark from shrinking", () => {
    const { container } = render(<SiteHeader brandName="ParkMath" brandPrefix="Park" links={LINKS} />);
    expect(screen.getByText("Park")).toBeDefined();
    expect(screen.getByText("Math")).toBeDefined();
    expect(container.querySelector("a[aria-label='ParkMath home']")!.className).toContain("shrink-0");
  });
});

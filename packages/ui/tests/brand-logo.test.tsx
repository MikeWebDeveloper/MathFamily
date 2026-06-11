// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { BrandLogo, MathGlyph } from "../src/brand-logo";
import { SiteHeader } from "../src/site-header";
import { SiteFooter } from "../src/site-footer";

afterEach(cleanup);

describe("MathGlyph", () => {
  it("renders the equals tile with two bars", () => {
    const { container } = render(<MathGlyph />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(container.querySelector(".mf-logo-bar-top")).not.toBeNull();
    expect(container.querySelector(".mf-logo-bar-bottom")).not.toBeNull();
  });
});

describe("BrandLogo", () => {
  it("renders prefix and the constant Math suffix", () => {
    render(<BrandLogo prefix="Park" />);
    expect(screen.getByText("Park")).toBeDefined();
    expect(screen.getByText("Math")).toBeDefined();
  });
});

describe("SiteHeader with logo", () => {
  it("renders the BrandLogo when brandPrefix is given", () => {
    render(<SiteHeader brandName="ParkMath" brandPrefix="Park" links={[{ label: "X", href: "/x" }]} />);
    expect(screen.getByText("Park")).toBeDefined();
    expect(screen.getByText("Math")).toBeDefined();
  });
});

describe("SiteFooter family lockup", () => {
  it("renders the =Math family line", () => {
    render(<SiteFooter brandName="ParkMath" links={[]} />);
    expect(screen.getByText(/=Math family/)).toBeDefined();
  });
});

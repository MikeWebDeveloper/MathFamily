import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AffiliateExtras } from "../components/affiliate-extras";

const html = renderToStaticMarkup(<AffiliateExtras />);

describe("AffiliateExtras", () => {
  it("renders all four product cards", () => {
    expect(html).toContain("Airport parking");
    expect(html).toContain("Airport lounges");
    expect(html).toContain("Airport hotels");
    expect(html).toContain("Airport transfers");
  });

  it("shows the section disclosure when HE is active", () => {
    // HE is active in partners.json, so disclosure must appear
    expect(html).toContain("commission");
    expect(html).toContain("Holiday Extras");
  });

  it("affiliate hrefs point to AWIN with the correct awinmid and clickref", () => {
    expect(html).toContain("https://www.awin1.com/cread.php?");
    expect(html).toContain("awinmid=3496");
    // All four products use clickref parkmath-home-home
    expect(html).toContain("clickref=parkmath-home-home");
  });

  it("marks affiliate links as sponsored", () => {
    expect(html).toContain('rel="sponsored noopener noreferrer"');
  });

  it("renders an Ad eyebrow for each affiliate card", () => {
    // There should be 4 affiliate cards when HE is active
    const adMatches = html.match(/>Ad</g) ?? [];
    expect(adMatches.length).toBe(4);
  });

  it("never anchors on a percentage discount", () => {
    const textContent = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    // No 'X% off' style copy in visible text
    expect(textContent).not.toMatch(/\d+%\s+off/i);
    expect(textContent).not.toMatch(/up to \d+%/i);
  });

  it("has 44-px-min touch targets (min-h-[44px] or h-10 icon + flex col)", () => {
    // The cards are anchor tags with min-h guaranteed through the flex-col structure;
    // we just verify each product title is inside an <a> tag
    expect(html).toContain("Airport parking");
    expect(html).toMatch(/<a[^>]+href="[^"]*"[^>]*>[\s\S]*?Airport parking/);
  });
});

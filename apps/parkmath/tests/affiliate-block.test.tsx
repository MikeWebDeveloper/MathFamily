import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AffiliateBlock } from "../components/affiliate-block";

describe("AffiliateBlock", () => {
  it("affiliate mode: Ad chip, sponsored AWIN link, ASA-compliant disclosure", () => {
    const html = renderToStaticMarkup(
      <AffiliateBlock slotId="parking-prebook" airportSlug="gatwick" officialUrl="https://www.gatwickairport.com/parking" />
    );
    expect(html).toContain(">Ad<");
    expect(html).toContain('rel="sponsored noopener noreferrer"');
    expect(html).toContain("https://www.awin1.com/cread.php?");
    expect(html).toContain("awinmid=3496");
    expect(html).toContain("clickref=parkmath-gatwick");
    expect(html).toContain("ParkMath earns a commission");
    expect(html).not.toContain("may earn");
  });

  it("official mode: no Ad chip, no sponsored rel, links to the official URL", () => {
    const html = renderToStaticMarkup(
      <AffiliateBlock slotId="lounge-membership" airportSlug="gatwick" officialUrl="https://www.prioritypass.com" />
    );
    expect(html).toContain('href="https://www.prioritypass.com"');
    expect(html).not.toContain(">Ad<");
    expect(html).not.toContain("sponsored");
    expect(html).not.toContain("earns a commission");
  });
});

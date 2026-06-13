import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DealsStrip } from "../components/deals-strip";

const html = renderToStaticMarkup(<DealsStrip />);

describe("DealsStrip", () => {
  it("routes to /airport-parking and never anchors on a percentage", () => {
    expect(html).toContain('href="/airport-parking"');
    expect(html).not.toContain("%25"); // no literal % in visible text
    // Ensure no bare % character appears outside of encoded URLs
    // Strip out href attribute values to check only text content
    const textContent = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    expect(textContent).not.toMatch(/%/);
  });
  it("shows an affiliate disclosure while the parking partner is active", () => {
    const textContent = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    expect(textContent).toContain("commission");
    expect(textContent).toContain("Holiday Extras");
  });
});

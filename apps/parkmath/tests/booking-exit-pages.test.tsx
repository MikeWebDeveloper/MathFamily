import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import BlueBadgePage, { generateStaticParams as blueBadgeParams } from "../app/blue-badge/[airport]/page";
import AvoidPage, { generateStaticParams as avoidParams } from "../app/avoid-drop-off-charge/[airport]/page";

// The two highest-traffic templates (blue-badge 44% and avoid-drop-off-charge 13% of GSC clicks) had a
// contextual bridge but no sticky bar, so a visitor who scrolled past the bridge had no booking exit.
// The drop-off, options and parking-vs-drop-off templates already carry <StickyBookingBar>.

type Page = (props: { params: Promise<{ airport: string }> }) => Promise<React.JSX.Element>;
const render = async (Page: Page, airport: string) => renderToStaticMarkup(await Page({ params: Promise.resolve({ airport }) }));

const STICKY = /<div role="region" aria-label="Compare [^"]+ parking prices"/;

describe.each([
  ["blue-badge", BlueBadgePage as unknown as Page, blueBadgeParams],
  ["avoid-drop-off-charge", AvoidPage as unknown as Page, avoidParams]
] as const)("/%s/[airport] booking exits", (_name, Page, params) => {
  it("carries the sticky mobile booking bar pointing at the on-page merchant block (gatwick)", async () => {
    const html = await render(Page, "gatwick");
    expect(html).toMatch(STICKY);
    expect(html).toContain('href="#mf-merchant-block"');
    expect(html).toContain('id="mf-merchant-block"');
    // Mobile-only, like every other template that carries it.
    expect(html).toMatch(/sm:hidden/);
  });

  it("keeps the existing contextual bridge (not duplicated)", async () => {
    const html = await render(Page, "gatwick");
    expect(html).toMatch(/Compare \d+ providers? below/);
    expect(html.match(/Compare \d+ providers? below/g)).toHaveLength(1);
  });

  it("the bar is rendered exactly when the merchant block it scrolls to exists, for every airport", async () => {
    for (const { airport } of params()) {
      const html = await render(Page, airport);
      const hasBlock = html.includes('id="mf-merchant-block"');
      expect(STICKY.test(html), `${airport}: sticky bar present iff merchant block present`).toBe(hasBlock);
    }
  });
});

import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HubBookingCta } from "../components/hub-booking-cta";
import type { LeagueEntry } from "../lib/content";

function entry(partial: Partial<LeagueEntry> & Pick<LeagueEntry, "airportSlug" | "name">): LeagueEntry {
  return {
    feePence: 800,
    minutes: 10,
    perMinutePence: 80,
    isFree: false,
    isPerEntry: false,
    ...partial,
  };
}

const charging: LeagueEntry[] = [
  entry({ airportSlug: "southend", name: "Southend" }),
  entry({ airportSlug: "gatwick", name: "Gatwick" }),
];

const html = renderToStaticMarkup(<HubBookingCta league={charging} />);

describe("HubBookingCta", () => {
  it("renders a tracked /go link per charging airport with surface=hub (not a bare awin link)", () => {
    expect(html).toContain('href="/go/southend/parking?s=hub"');
    expect(html).toContain('href="/go/gatwick/parking?s=hub"');
    expect(html).not.toContain("https://www.awin1.com/cread.php?");
    expect(html).toContain('rel="sponsored noopener noreferrer"');
  });

  it("carries the ASA 'Ad' disclosure label and the neutrality line", () => {
    expect(html).toContain(">Ad<");
    expect(html).toContain("never affects our ranking");
  });

  it("fails closed: free-only league renders nothing (graceful absence, no broken CTA)", () => {
    const freeOnly: LeagueEntry[] = [
      entry({ airportSlug: "luton-free", name: "Free Field", isFree: true, feePence: 0, perMinutePence: null }),
    ];
    expect(renderToStaticMarkup(<HubBookingCta league={freeOnly} />)).toBe("");
  });

  it("fails closed: empty league renders nothing", () => {
    expect(renderToStaticMarkup(<HubBookingCta league={[]} />)).toBe("");
  });
});

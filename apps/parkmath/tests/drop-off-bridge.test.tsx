import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DropOffCalculatorBridge } from "../components/drop-off-calculator-bridge";
import { DropOffParkingBridge } from "../components/drop-off-bridge";

describe("DropOffCalculatorBridge (above-the-fold teaser)", () => {
  const html = renderToStaticMarkup(<DropOffCalculatorBridge slug="heathrow" />);

  it("labels the figure as the drive-up gate rate and says pre-booking is usually cheaper (no 'from' price)", () => {
    expect(html).toContain("The drive-up gate rate for 7 days is £271.20");
    expect(html).toContain("pre-booking online is usually cheaper");
    expect(html).not.toMatch(/parking from/);
  });

  it("'Compare' goes to the airport's options page, a plain internal link, not one merchant's /go redirect", () => {
    expect(html).toContain('href="/airport-parking-options/heathrow"');
    expect(html).not.toContain("/go/heathrow/parking");
    // An internal comparison link is not an affiliate link: no sponsored/nofollow on it.
    expect(html).not.toContain("sponsored");
    expect(html).not.toContain("nofollow");
  });

  it("renders nothing for a free-drop-off airport (fail-closed)", () => {
    expect(renderToStaticMarkup(<DropOffCalculatorBridge slug="birmingham" />)).toBe("");
  });
});

describe("DropOffParkingBridge (body-level decision callout)", () => {
  it("tier 1 names the figure as the drive-up gate rate and points to compare live prices", () => {
    const html = renderToStaticMarkup(<DropOffParkingBridge slug="heathrow" airportName="Heathrow Airport" />);
    expect(html).toMatch(/drive-up gate rate/);
    expect(html).toContain("£271.20");
    expect(html).toMatch(/pre-booking online is usually cheaper/i);
    expect(html).toContain('href="/parking-vs-drop-off/heathrow"');
  });

  it("tier 2 (free drop-off airport) no longer promises 'gate vs pre-book' on a page that may show only gate prices", () => {
    const html = renderToStaticMarkup(<DropOffParkingBridge slug="birmingham" airportName="Birmingham Airport" />);
    expect(html).toContain('href="/airport-parking/birmingham"');
    expect(html).not.toMatch(/gate vs pre-book/i);
  });

  it("tier 3 (no tariff yet) compares on the options page instead of opening one merchant", () => {
    const html = renderToStaticMarkup(<DropOffParkingBridge slug="norwich" airportName="Norwich Airport" />);
    expect(html).toContain('href="/airport-parking-options/norwich"');
    expect(html).not.toContain("/go/norwich/parking");
    expect(html).not.toContain("sponsored");
    expect(html).toMatch(/Compare/);
  });

  it("renders nothing when there is nowhere honest to send a parker (free airport, no parking page)", () => {
    expect(renderToStaticMarkup(<DropOffParkingBridge slug="inverness" airportName="Inverness Airport" />)).toBe("");
  });
});

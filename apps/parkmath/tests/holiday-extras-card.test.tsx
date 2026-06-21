import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HolidayExtrasCard } from "../components/holiday-extras-card";

const dropoff = renderToStaticMarkup(
  <HolidayExtrasCard product="parking" airportName="Gatwick" airportSlug="gatwick" surface="dropoff" extras={["hotels", "lounge", "transfers"]} />
);
const lounge = renderToStaticMarkup(
  <HolidayExtrasCard product="lounge" airportName="Gatwick" airportSlug="gatwick" surface="lounge" />
);

describe("HolidayExtrasCard", () => {
  it("drop-off parking card: Ad, sponsored first-party deep link, extras, compliant copy", () => {
    expect(dropoff).toContain(">Ad<");
    expect(dropoff).toContain("Book parking");
    // Click measurement: links go through the first-party /go redirect (surface carried as ?s=),
    // not a bare awin1.com link. The route rebuilds the exact AWIN deep link before the 302.
    expect(dropoff).not.toContain("https://www.awin1.com/cread.php?");
    expect(dropoff).toContain('href="/go/gatwick/parking?s=dropoff"');
    expect(dropoff).toContain("Also from Holiday Extras");
    expect(dropoff).toContain('href="/go/gatwick/hotels?s=dropoff-hotels"');
    expect(dropoff).toContain('rel="sponsored noopener noreferrer"');
    expect(dropoff).not.toContain(">Up to 25% off<");
    expect(dropoff).not.toContain("may earn");
  });

  it("lounge card: Ad, first-party lounge link carrying the lounge surface", () => {
    expect(lounge).toContain(">Ad<");
    expect(lounge).toContain("Book lounge");
    expect(lounge).not.toContain("https://www.awin1.com/cread.php?");
    expect(lounge).toContain('href="/go/gatwick/lounge?s=lounge"');
    expect(lounge).not.toContain("may earn");
  });
});

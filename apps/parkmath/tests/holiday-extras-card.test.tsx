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
  it("drop-off parking card: Ad, sponsored deep link, extras, compliant copy", () => {
    expect(dropoff).toContain(">Ad<");
    expect(dropoff).toContain("Book parking");
    expect(dropoff).toContain("https://www.awin1.com/cread.php?");
    expect(dropoff).toContain("awinmid=3496");
    expect(dropoff).toContain("clickref=parkmath-gatwick-dropoff");
    expect(dropoff).toContain("ued=https%3A%2F%2Fwww.holidayextras.com%2Fgatwick-airport-parking.html");
    expect(dropoff).toContain("Also from Holiday Extras");
    expect(dropoff).toContain("clickref=parkmath-gatwick-dropoff-hotels");
    expect(dropoff).toContain('rel="sponsored noopener noreferrer"');
    expect(dropoff).not.toContain(">Up to 25% off<");
    expect(dropoff).not.toContain("may earn");
  });

  it("lounge card: Ad, lounge deep link with lounge clickref", () => {
    expect(lounge).toContain(">Ad<");
    expect(lounge).toContain("Book lounge");
    expect(lounge).toContain("clickref=parkmath-gatwick-lounge");
    expect(lounge).toContain("ued=https%3A%2F%2Fwww.holidayextras.com%2Fairport-lounges.html");
    expect(lounge).not.toContain("may earn");
  });
});

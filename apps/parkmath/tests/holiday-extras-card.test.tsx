import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HolidayExtrasCard } from "../components/holiday-extras-card";

const dropoff = renderToStaticMarkup(
  <HolidayExtrasCard product="parking" airportName="Gatwick" airportSlug="gatwick" surface="dropoff" extras={["hotels", "lounge", "transfers"]} />
);
// Norwich is HE-only — the parking card must show exactly one option (Holiday Extras), no broken links.
const heOnly = renderToStaticMarkup(
  <HolidayExtrasCard product="parking" airportName="Norwich" airportSlug="norwich" surface="dropoff" extras={["hotels", "lounge", "transfers"]} />
);
const lounge = renderToStaticMarkup(
  <HolidayExtrasCard product="lounge" airportName="Gatwick" airportSlug="gatwick" surface="lounge" />
);

function merchantOrder(markup: string): string[] {
  const out: string[] = [];
  const re = /Book parking with ([A-Za-z ]+?) ↗/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markup)) !== null) out.push(m[1]!.trim());
  return out;
}

describe("HolidayExtrasCard", () => {
  it("drop-off parking card: multi-merchant — every covered merchant is its own tracked option (alphabetical)", () => {
    expect(dropoff).toContain(">Ad<");
    // Gatwick → all four merchants, alphabetical, each its own per-merchant /go redirect.
    expect(merchantOrder(dropoff)).toEqual(["Airparks", "APH", "Holiday Extras", "Purple Parking"]);
    // Click measurement: links go through the first-party /go redirect, not a bare awin1.com link.
    expect(dropoff).not.toContain("https://www.awin1.com/cread.php?");
    expect(dropoff).toContain('href="/go/gatwick/parking%3Aaph?s=dropoff"');
    expect(dropoff).toContain('href="/go/gatwick/parking%3Aholiday-extras?s=dropoff"');
    expect(dropoff).toContain("Also from Holiday Extras");
    expect(dropoff).toContain('href="/go/gatwick/hotels?s=dropoff-hotels"');
    expect(dropoff).toContain('rel="sponsored noopener noreferrer"');
    expect(dropoff).toContain("ordered alphabetically");
    expect(dropoff).not.toContain(">Up to 25% off<");
    expect(dropoff).not.toContain("may earn");
  });

  it("HE-only airport: parking card shows exactly one option and no broken non-covering link", () => {
    expect(merchantOrder(heOnly)).toEqual(["Holiday Extras"]);
    expect(heOnly).toContain('href="/go/norwich/parking%3Aholiday-extras?s=dropoff"');
    expect(heOnly).not.toContain("parking%3Aaph");
    expect(heOnly).not.toContain("parking%3Apurple-parking");
  });

  it("lounge card: Ad, first-party lounge link carrying the lounge surface", () => {
    expect(lounge).toContain(">Ad<");
    expect(lounge).toContain("Book lounge");
    expect(lounge).not.toContain("https://www.awin1.com/cread.php?");
    expect(lounge).toContain('href="/go/gatwick/lounge?s=lounge"');
    expect(lounge).not.toContain("may earn");
  });
});

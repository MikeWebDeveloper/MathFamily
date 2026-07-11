import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HolidayExtrasCard } from "../components/holiday-extras-card";

const dropoff = renderToStaticMarkup(
  <HolidayExtrasCard product="parking" airportName="Gatwick" airportSlug="gatwick" surface="dropoff" extras={["hotels", "lounge", "transfers"]} />
);
// Belfast International: Holiday Extras + Park BCP + Purple Parking (verified per-airport pages,
// 2026-07-11 coverage expansion) genuinely cover it; APH/Airparks still have no verified page → fail
// closed for those two — the parking card must show exactly those three options, no broken links.
const belfastIntl = renderToStaticMarkup(
  <HolidayExtrasCard product="parking" airportName="Belfast International" airportSlug="belfast-international" surface="dropoff" extras={["hotels", "lounge", "transfers"]} />
);
const lounge = renderToStaticMarkup(
  <HolidayExtrasCard product="lounge" airportName="Gatwick" airportSlug="gatwick" surface="lounge" />
);
// Heathrow carries a Mike-directed primary override (2026-07-11): Heathrow Airport Parking (mid 2365)
// is pinned first; every other covered merchant still appears, ordered alphabetically after it.
const heathrowDropoff = renderToStaticMarkup(
  <HolidayExtrasCard product="parking" airportName="Heathrow" airportSlug="heathrow" surface="dropoff" extras={["hotels", "lounge", "transfers"]} />
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
    // Gatwick → all five merchants, alphabetical, each its own per-merchant /go redirect.
    // Park BCP (awinmid 3495) joined 2026-06-26; sorts between Holiday Extras and Purple Parking.
    expect(merchantOrder(dropoff)).toEqual(["Airparks", "APH", "Holiday Extras", "Park BCP", "Purple Parking"]);
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

  it("Belfast International: shows every genuinely-covering merchant, omits non-covering ones (no broken link)", () => {
    expect(merchantOrder(belfastIntl)).toEqual(["Holiday Extras", "Park BCP", "Purple Parking"]);
    expect(belfastIntl).toContain('href="/go/belfast-international/parking%3Aholiday-extras?s=dropoff"');
    expect(belfastIntl).toContain('href="/go/belfast-international/parking%3Apark-bcp?s=dropoff"');
    expect(belfastIntl).toContain('href="/go/belfast-international/parking%3Apurple-parking?s=dropoff"');
    // APH and Airparks still have no verified Belfast International page — correctly absent.
    expect(belfastIntl).not.toContain("parking%3Aaph");
    expect(belfastIntl).not.toContain("parking%3Aairparks");
  });

  it("Heathrow: official-operator pin (data-driven isOfficialOperator flag) puts Heathrow Airport Parking first; disclosure names it honestly", () => {
    expect(merchantOrder(heathrowDropoff)).toEqual([
      "Heathrow Airport Parking",
      "Airparks",
      "APH",
      "Holiday Extras",
      "Park BCP",
      "Purple Parking",
    ]);
    expect(heathrowDropoff).toContain("Heathrow Airport Parking is shown first");
    expect(heathrowDropoff).not.toContain("we show every partner that serves Heathrow, ordered alphabetically");
  });

  it("2026-07-11 coverage expansion: Prestwick now shows 4 options (was 2) — Purple Parking and Airparks gained verified pages, no official-operator pin", () => {
    const prestwick = renderToStaticMarkup(
      <HolidayExtrasCard product="parking" airportName="Glasgow Prestwick" airportSlug="prestwick" surface="dropoff" />
    );
    expect(merchantOrder(prestwick)).toEqual(["Airparks", "Holiday Extras", "Park BCP", "Purple Parking"]);
    expect(prestwick).toContain('href="/go/prestwick/parking%3Apurple-parking?s=dropoff"');
    expect(prestwick).toContain('href="/go/prestwick/parking%3Aairparks?s=dropoff"');
    // APH still has no verified Prestwick page — correctly absent, never a broken link.
    expect(prestwick).not.toContain("parking%3Aaph");
    // No official operator serves Prestwick — plain alphabetical disclosure, same as any other airport.
    expect(prestwick).not.toContain("is shown first");
  });

  it("lounge card: Ad, first-party lounge link carrying the lounge surface", () => {
    expect(lounge).toContain(">Ad<");
    expect(lounge).toContain("Book lounge");
    expect(lounge).not.toContain("https://www.awin1.com/cread.php?");
    expect(lounge).toContain('href="/go/gatwick/lounge?s=lounge"');
    expect(lounge).not.toContain("may earn");
  });
});

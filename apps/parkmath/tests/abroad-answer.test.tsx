import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AbroadAnswer } from "../components/abroad-answer";
import type { AbroadModel } from "../lib/abroad-content";

const model: AbroadModel = {
  airport: { slug: "manchester", name: "Manchester", iata: "MAN", lat: 53.36, lng: -2.27 } as AbroadModel["airport"],
  hasParking: true,
  cheapestParkingPence: 5999,
  cheapestParkingName: "Jet Parks 1",
  gateParkingPence: 9000,
  dropOff: { isFree: false, chargePence: 500 },
  roaming: { totalDestinations: 40, includedCount: 30, rowDailyFromPence: 200 },
  baggage: { cabinMinPence: 0, cabinMaxPence: 4500 },
  verifiedAt: "2026-06-14",
  faqs: [{ question: "Q?", answer: "A." }]
};

describe("AbroadAnswer", () => {
  const html = renderToStaticMarkup(<AbroadAnswer model={model} roammathUrl="https://roammath.co.uk" />);
  it("renders a speakable answer with the airport name and parking figure", () => {
    expect(html).toContain("mf-speakable");
    expect(html).toContain("Manchester");
    expect(html).toContain("£59.99");
  });
  it("links to RoamMath for per-destination detail", () => {
    expect(html).toContain("https://roammath.co.uk/roaming");
    expect(html).toContain('rel="noopener noreferrer"');
  });
  it("does NOT render a per-destination roaming table (compact summary only)", () => {
    expect(html).not.toContain("<table");
  });
});

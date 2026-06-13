import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { NearbyAirports } from "../components/nearby-airports";

type TestAirport = { name: string; slug: string; iata: string; region: string; lat: number; lng: number };
const airports: TestAirport[] = [
  { name: "Heathrow", slug: "heathrow", iata: "LHR", region: "London", lat: 51.47, lng: -0.4543 },
  { name: "Gatwick", slug: "gatwick", iata: "LGW", region: "London", lat: 51.1537, lng: -0.1821 },
];

describe("NearbyAirports", () => {
  it("renders the find-near-me button and the privacy note, with no results until located", () => {
    const html = renderToStaticMarkup(
      <NearbyAirports airports={airports} feeBySlug={{ heathrow: "£6.00 drop-off" }} />,
    );
    expect(html).toContain("Find airports near me");
    expect(html).toMatch(/stays in your browser/i);
    expect(html).not.toContain('href="/drop-off-charges/');
  });

  it("does not render a live-region node when idle (no empty sr-only node)", () => {
    // LiveRegion now returns null for an empty message, so the idle state
    // must not emit a bare aria-live node (Fix 1: empty-guard).
    const html = renderToStaticMarkup(<NearbyAirports airports={airports} />);
    expect(html).not.toContain('aria-live=');
  });
});

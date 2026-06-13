import { describe, expect, it } from "vitest";
import { parkingChartSvg } from "../lib/chart-svg";

describe("parkingChartSvg", () => {
  it("renders a valid SVG with the airport, both prices and the saving", () => {
    const svg = parkingChartSvg({
      airportName: "Manchester", iata: "MAN",
      gatePence: 14000, prebookPence: 4999, prebookName: "JetParks", verifiedAt: "2026-06-10"
    });
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg.trimEnd().endsWith("</svg>")).toBe(true);
    expect(svg).toContain("Manchester");
    expect(svg).toContain("£140.00");
    expect(svg).toContain("£49.99");
    expect(svg).toContain("£90.01"); // 14000 − 4999 = 9001p
    expect(svg).toContain("parkmath.co.uk");
  });
  it("escapes XML-special characters in the airport + product name", () => {
    const svg = parkingChartSvg({
      airportName: "A & B", iata: "XXX",
      gatePence: 1000, prebookPence: 500, prebookName: "P <x>", verifiedAt: "2026-01-01"
    });
    expect(svg).toContain("A &amp; B");
    expect(svg).toContain("P &lt;x&gt;");
    expect(svg).not.toContain("A & B");
  });
  it("never produces a negative saving", () => {
    const svg = parkingChartSvg({
      airportName: "X", iata: "XXX", gatePence: 500, prebookPence: 900, prebookName: "P", verifiedAt: "2026-01-01"
    });
    expect(svg).toContain("£0.00");
  });
});

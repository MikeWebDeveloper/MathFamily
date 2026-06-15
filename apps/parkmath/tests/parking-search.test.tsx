import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ParkingSearch } from "../components/parking-search";

const airports = [
  { slug: "gatwick", name: "Gatwick", iata: "LGW" },
  { slug: "manchester", name: "Manchester", iata: "MAN" },
];

const html = renderToStaticMarkup(<ParkingSearch airports={airports} />);

describe("ParkingSearch", () => {
  it("renders the search heading and a labelled airport input", () => {
    expect(html).toContain("Find airport parking");
    expect(html).toContain('list="pm-airports"');
  });

  it("lists each airport as a datalist option (typeahead source)", () => {
    expect(html).toContain('value="Gatwick"');
    expect(html).toContain('value="Manchester"');
  });

  it("renders two native date inputs", () => {
    expect(html.match(/type="date"/g)?.length).toBe(2);
  });

  it("defaults the CTA to the internal parking hub when no airport is chosen (JS-off safe)", () => {
    expect(html).toContain('href="/airport-parking"');
    expect(html).not.toContain("awin1.com/cread.php");
  });

  it("shows an Ad/commission disclosure", () => {
    expect(html).toContain("Ad");
    expect(html).toContain("commission");
  });

  it("sets a min on the date inputs (no past dates on mobile pickers)", () => {
    expect(html).toContain('min=');
  });
});

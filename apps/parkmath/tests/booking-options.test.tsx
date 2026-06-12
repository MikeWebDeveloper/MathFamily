import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { BookingOptions } from "../components/booking-options";

const html = renderToStaticMarkup(
  <BookingOptions airportName="Gatwick" airportSlug="gatwick" officialUrl="https://www.gatwickairport.com/parking" />
);

describe("BookingOptions", () => {
  it("renders the official route as a non-sponsored equal-weight button", () => {
    expect(html).toContain("Book direct with the airport");
    expect(html).toContain("Go to airport site");
    expect(html).toContain('href="https://www.gatwickairport.com/parking"');
    expect(html).not.toContain('href="https://www.gatwickairport.com/parking" rel="sponsored');
  });

  it("renders the Holiday Extras route with Ad, benefits, compliant discount + deep link", () => {
    expect(html).toContain(">Ad<");
    expect(html).toContain("Free cancellation (cancel to arrival)");
    expect(html).toContain("up to 25% at Gatwick");
    expect(html).toContain("Discount applied automatically");
    expect(html).toContain("https://www.awin1.com/cread.php?");
    expect(html).toContain("awinmid=3496");
    expect(html).toContain("clickref=parkmath-gatwick");
    expect(html).toContain("ued=https%3A%2F%2Fwww.holidayextras.com%2Fairport-parking.html");
    expect(html).toContain("Book my parking");
    expect(html).toContain('rel="sponsored noopener noreferrer"');
  });

  it("keeps the ranking commission-blind and avoids non-compliant copy", () => {
    expect(html).toContain("never changes our ranking");
    expect(html).not.toContain(">Up to 25% off<");
    expect(html).not.toContain("may earn");
    expect(html).not.toContain("up to 75%");
  });
});

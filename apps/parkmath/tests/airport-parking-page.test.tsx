import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ParkingHubPage from "../app/airport-parking/[airport]/page";

async function render(airport: string): Promise<string> {
  return renderToStaticMarkup(await ParkingHubPage({ params: Promise.resolve({ airport }) }));
}

describe("/airport-parking/[airport] only promises what it shows", () => {
  it("heathrow (gate-only record): H1 and schema description do not claim a pre-book comparison", async () => {
    const html = await render("heathrow");
    expect(html).toMatch(/<h1[^>]*>London Heathrow parking: drive-up gate prices<\/h1>/);
    expect(html).toContain("Official drive-up gate parking prices at London Heathrow");
    expect(html).not.toContain("Gate vs pre-book parking at");
  });

  it("manchester (has a dated pre-book product): keeps the gate vs pre-book framing", async () => {
    const html = await render("manchester");
    expect(html).toMatch(/<h1[^>]*>Manchester parking: gate vs pre-book<\/h1>/);
    expect(html).toContain("Gate vs pre-book parking at");
  });
});

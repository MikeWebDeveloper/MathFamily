import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CarIcon, ParkingIcon, LoungeIcon, PriceIndexIcon, NewsIcon, DataIcon } from "../components/tile-icons";

describe("tile icons", () => {
  it("each renders a decorative aria-hidden svg", () => {
    for (const Icon of [CarIcon, ParkingIcon, LoungeIcon, PriceIndexIcon, NewsIcon, DataIcon]) {
      const html = renderToStaticMarkup(<Icon />);
      expect(html).toContain("<svg");
      expect(html).toContain("aria-hidden");
    }
  });
});

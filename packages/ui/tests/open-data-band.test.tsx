// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { OpenDataBand } from "../src/open-data-band";

afterEach(cleanup);

describe("OpenDataBand", () => {
  it("renders a download link for each entry", () => {
    render(
      <OpenDataBand
        downloads={[
          { href: "/data/drop-off-charges.csv", label: "Drop-off charges (CSV)" },
          { href: "/data/parking-tariffs.csv", label: "Parking tariffs (CSV)" }
        ]}
        citation={`ParkMath, "UK Airport Parking & Drop-off Price Index 2026", verified 2026-06-14, parkmath.co.uk`}
      />
    );

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]?.getAttribute("href")).toBe("/data/drop-off-charges.csv");
    expect(links[0]?.hasAttribute("download")).toBe(true);
    expect(links[1]?.getAttribute("href")).toBe("/data/parking-tariffs.csv");
    expect(links[1]?.hasAttribute("download")).toBe(true);
  });

  it("renders the citation string", () => {
    const citation = `ParkMath, "UK airport drop-off charges", verified 2026-06-14, parkmath.co.uk`;
    const { container } = render(
      <OpenDataBand
        downloads={[{ href: "/data/drop-off-charges.csv", label: "Drop-off charges (CSV)" }]}
        citation={citation}
      />
    );
    expect(container.textContent).toContain("Cite:");
    expect(container.textContent).toContain(citation);
  });

  it("renders single download when one href supplied", () => {
    render(
      <OpenDataBand
        downloads={[{ href: "/data/drop-off-charges.csv", label: "Drop-off charges (CSV)" }]}
        citation="ParkMath, test, 2026-06-14, parkmath.co.uk"
      />
    );
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByText(/Drop-off charges/)).toBeDefined();
  });
});

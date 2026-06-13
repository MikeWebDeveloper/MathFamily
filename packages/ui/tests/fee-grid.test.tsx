// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { FeeGrid } from "../src/fee-grid";

afterEach(cleanup);

const COLS = ["Airport", "Fee", "Free alternative"];
const ROWS = [["Heathrow", "£7", "Park & Ride"], ["Gatwick", "£10", "—"]];

describe("FeeGrid responsive + column typing", () => {
  it("renders BOTH a md+ table and a md:hidden card list of the same rows", () => {
    const { container } = render(<FeeGrid columns={COLS} rows={ROWS} numericColumns={[1]} />);
    const table = container.querySelector("table");
    expect(table).not.toBeNull();
    expect(table!.className).toContain("md:table");
    expect(table!.className).toContain("hidden");
    const cards = container.querySelector('[data-testid="fee-grid-cards"]');
    expect(cards).not.toBeNull();
    expect(cards!.className).toContain("md:hidden");
    // 2 rows → 2 cards
    expect(cards!.querySelectorAll('[data-testid="fee-grid-card"]')).toHaveLength(2);
  });

  it("numeric columns are right-aligned mono with ink weight; prose columns are left normal", () => {
    const { container } = render(<FeeGrid columns={COLS} rows={ROWS} numericColumns={[1]} />);
    const firstBodyRow = container.querySelector("tbody tr")!;
    const cells = firstBodyRow.querySelectorAll("td");
    // td[0] is the "Fee" numeric column (col index 1)
    expect(cells[0]!.className).toContain("text-right");
    expect(cells[0]!.className).toContain("mf-num");
    expect(cells[0]!.className).toContain("text-ink");
    expect(cells[0]!.className).not.toContain("text-ink-muted");
    // td[1] is the "Free alternative" prose column (col index 2)
    expect(cells[1]!.className).toContain("text-left");
    expect(cells[1]!.className).not.toContain("mf-num");
  });

  it("back-compat: omitting numericColumns treats every column > 0 as numeric", () => {
    const { container } = render(<FeeGrid columns={["A", "B"]} rows={[["x", "1"]]} />);
    const td = container.querySelector("tbody tr td")!;
    expect(td.className).toContain("mf-num");
    expect(td.className).toContain("text-right");
  });

  it("highlightRow still flags the winner row and card", () => {
    const { container } = render(<FeeGrid columns={COLS} rows={ROWS} numericColumns={[1]} highlightRow={1} />);
    const rows = container.querySelectorAll("tbody tr");
    expect(rows[1]!.className).toContain("mf-winner-row");
    const cards = container.querySelectorAll('[data-testid="fee-grid-card"]');
    expect(cards[1]!.className).toContain("mf-winner-row");
  });

  it("rowHref makes each card a single covering link and the table name a link", () => {
    const { container } = render(
      <FeeGrid
        columns={["Airport", "Fee"]}
        rows={[["Gatwick", "£6"], ["Luton", "£5"]]}
        rowHref={(i) => `/a/${i}`}
      />,
    );
    // mobile cards: one .mf-row-link per row, card is relative
    const cardLinks = container.querySelectorAll('[data-testid="fee-grid-card"] a.mf-row-link');
    expect(cardLinks.length).toBe(2);
    expect((cardLinks[0] as HTMLAnchorElement).getAttribute("href")).toBe("/a/0");
    // desktop table: first-cell name is a link
    expect(container.querySelector('table th[scope="row"] a')).not.toBeNull();
  });
  it("highlightColumn tints that column's cells", () => {
    const { container } = render(
      <FeeGrid columns={["Airport", "Fee"]} rows={[["Gatwick", "£6"]]} highlightColumn={1} />,
    );
    expect(container.querySelector("td.mf-col-hi")).not.toBeNull();
  });
});

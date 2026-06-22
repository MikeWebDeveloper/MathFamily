// @vitest-environment jsdom
import { afterEach, expect, it, describe } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { WidgetLayout } from "../src/widget-layout";

afterEach(cleanup);

describe("WidgetLayout", () => {
  it("renders the title", () => {
    render(
      <WidgetLayout title="UK drop-off fees" verifiedAt="2026-06-01" attributionUrl="https://parkmath.co.uk/drop-off-charges">
        <p>content</p>
      </WidgetLayout>
    );
    expect(screen.getByText("UK drop-off fees")).toBeTruthy();
  });

  it("renders a formatted verification date in the badge", () => {
    render(
      <WidgetLayout title="Test widget" verifiedAt="2026-06-01" attributionUrl="https://parkmath.co.uk">
        <p>content</p>
      </WidgetLayout>
    );
    // The badge span carries aria-label="Data verified 1 Jun 2026"
    expect(screen.getByText(/Verified 1 Jun 2026/)).toBeTruthy();
  });

  it("renders the attribution link with the correct href", () => {
    render(
      <WidgetLayout title="Test" verifiedAt="2026-06-01" attributionUrl="https://parkmath.co.uk/drop-off-charges">
        <p>content</p>
      </WidgetLayout>
    );
    const links = screen.getAllByRole("link");
    const attrLinks = links.filter((l) =>
      (l as HTMLAnchorElement).href.includes("parkmath.co.uk")
    );
    expect(attrLinks.length).toBeGreaterThanOrEqual(1);
  });

  it("renders children inside the layout", () => {
    render(
      <WidgetLayout title="Test" verifiedAt="2026-06-01" attributionUrl="https://example.com">
        <p data-testid="child">hello widget</p>
      </WidgetLayout>
    );
    expect(screen.getByTestId("child")).toBeTruthy();
  });

  it("uses a custom brandName in the attribution text", () => {
    render(
      <WidgetLayout title="Test" verifiedAt="2026-06-01" attributionUrl="https://example.com" brandName="SideKick">
        <span />
      </WidgetLayout>
    );
    expect(screen.getByText("SideKick")).toBeTruthy();
  });

  it("uses a custom ariaLabel on the section landmark", () => {
    render(
      <WidgetLayout title="Test" verifiedAt="2026-06-01" attributionUrl="https://example.com" ariaLabel="Custom label">
        <span />
      </WidgetLayout>
    );
    expect(screen.getByRole("region", { name: "Custom label" })).toBeTruthy();
  });

  it("falls back to the title as the aria-label when ariaLabel is omitted", () => {
    render(
      <WidgetLayout title="My widget title" verifiedAt="2026-06-01" attributionUrl="https://example.com">
        <span />
      </WidgetLayout>
    );
    expect(screen.getByRole("region", { name: "My widget title" })).toBeTruthy();
  });

  it("renders parkmath.co.uk → attribution text link", () => {
    render(
      <WidgetLayout title="Test" verifiedAt="2026-06-01" attributionUrl="https://parkmath.co.uk">
        <span />
      </WidgetLayout>
    );
    expect(screen.getByRole("link", { name: /Visit ParkMath for full data/ })).toBeTruthy();
  });
});

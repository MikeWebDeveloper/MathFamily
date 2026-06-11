// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { UkMap } from "../src/uk-map";
import { RegionMap } from "../src/region-map";
import { CountryFlag } from "../src/country-flag";

afterEach(cleanup);

describe("UkMap", () => {
  it("renders the outline and one marker group per marker", () => {
    const { container } = render(
      <UkMap markers={[{ lat: 51.47, lng: -0.4543, active: true }, { lat: 55.95, lng: -3.3725 }]} />
    );
    expect(container.querySelectorAll("path")).toHaveLength(1);
    expect(container.querySelectorAll("g")).toHaveLength(2);
    expect(container.querySelector(".mf-pulse")).not.toBeNull();
  });
});

describe("RegionMap", () => {
  it("renders world outline + highlighted country + pulse dot", () => {
    const { container } = render(<RegionMap iso2="es" />);
    expect(container.querySelectorAll("path")).toHaveLength(2);
    expect(container.querySelector(".mf-pulse")).not.toBeNull();
  });
  it("renders nothing for an unknown country", () => {
    const { container } = render(<RegionMap iso2="zz" />);
    expect(container.innerHTML).toBe("");
  });
});

describe("CountryFlag", () => {
  it("renders vendored flag markup", () => {
    const { container } = render(<CountryFlag iso2="es" />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg!.innerHTML.length).toBeGreaterThan(10);
  });
  it("renders nothing for an unknown code", () => {
    const { container } = render(<CountryFlag iso2="zz" />);
    expect(container.innerHTML).toBe("");
  });
});

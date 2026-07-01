// @vitest-environment jsdom
import { render, cleanup, screen } from "@testing-library/react";
import { afterEach, test, expect } from "vitest";
import { TravelRailCard } from "../src/TravelRailCard";

afterEach(cleanup);

test("car-hire: renders heading, CTA, and disclosure when disclosureRequired", () => {
  render(
    <TravelRailCard
      kind="car-hire"
      countryName="Spain"
      affiliateUrl="https://discovercars.com/spain?clickref=car-hire-spain"
      partnerName="DiscoverCars"
      disclosureRequired={true}
    />
  );
  expect(screen.getByText(/Renting a car in Spain\?/i)).toBeTruthy();
  expect(screen.getByRole("link", { name: /Compare car hire prices/i })).toBeTruthy();
  expect(screen.getByText(/Affiliate link/i)).toBeTruthy();
});

test("car-hire: link has rel=sponsored and the exact affiliate URL", () => {
  render(
    <TravelRailCard
      kind="car-hire"
      countryName="Spain"
      affiliateUrl="https://discovercars.com/spain?clickref=car-hire-spain"
      partnerName="DiscoverCars"
      disclosureRequired={true}
    />
  );
  const link = screen.getByRole("link", { name: /Compare car hire prices/i }) as HTMLAnchorElement;
  expect(link.rel).toContain("sponsored");
  expect(link.href).toBe("https://discovercars.com/spain?clickref=car-hire-spain");
});

test("travel-insurance: renders heading and CTA when disclosureRequired", () => {
  render(
    <TravelRailCard
      kind="travel-insurance"
      countryName="France"
      affiliateUrl="https://coverforyou.com/quote?clickref=travel-insurance-france"
      partnerName="CoverForYou"
      disclosureRequired={true}
    />
  );
  expect(screen.getByText(/Travel insurance for France/i)).toBeTruthy();
  expect(screen.getByRole("link", { name: /Get a travel insurance quote/i })).toBeTruthy();
});

test("renders nothing when disclosureRequired is false (fail-closed — no partner active)", () => {
  const { container } = render(
    <TravelRailCard
      kind="car-hire"
      countryName="Spain"
      affiliateUrl=""
      partnerName=""
      disclosureRequired={false}
    />
  );
  expect(container.firstChild).toBeNull();
});

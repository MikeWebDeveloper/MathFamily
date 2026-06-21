// @vitest-environment jsdom
import { render, cleanup, screen } from "@testing-library/react";
import { afterEach, test, expect } from "vitest";
import { EsimPickCard } from "../src/EsimPickCard";

afterEach(cleanup);

test("affiliate variant: renders best pick badge, price, provider, CTA, and disclosure", () => {
  render(
    <EsimPickCard
      providerName="Airalo"
      bundleName="Spain 5GB 7-Day"
      totalFormatted="£14.99"
      countryName="Spain"
      affiliateUrl="https://airalo.com/spain?ref=test"
      disclosureRequired={true}
    />
  );
  expect(screen.getByText(/Best eSIM pick/i)).toBeTruthy();
  expect(screen.getByText("Airalo")).toBeTruthy();
  expect(screen.getByText("£14.99")).toBeTruthy();
  expect(screen.getByText(/Spain · Spain 5GB 7-Day/i)).toBeTruthy();
  expect(screen.getByRole("link", { name: /Buy with Airalo/i })).toBeTruthy();
  expect(screen.getByText(/Affiliate link/i)).toBeTruthy();
  expect(screen.queryByText(/Affiliate link/i)?.textContent).toContain("Airalo");
});

test("affiliate variant: link has rel=sponsored", () => {
  render(
    <EsimPickCard
      providerName="Airalo"
      bundleName="Spain 5GB"
      totalFormatted="£14.99"
      countryName="Spain"
      affiliateUrl="https://airalo.com/spain?ref=test"
      disclosureRequired={true}
    />
  );
  const link = screen.getByRole("link", { name: /Buy with Airalo/i }) as HTMLAnchorElement;
  expect(link.rel).toContain("sponsored");
  expect(link.href).toBe("https://airalo.com/spain?ref=test");
});

test("fallback variant: renders official link, no badge, no disclosure", () => {
  render(
    <EsimPickCard
      providerName={null}
      bundleName={null}
      totalFormatted={null}
      countryName="Spain"
      affiliateUrl="https://airalo.com"
      disclosureRequired={false}
    />
  );
  expect(screen.getByRole("link", { name: /Check live eSIM prices/i })).toBeTruthy();
  expect(screen.queryByText(/Best eSIM pick/i)).toBeNull();
  expect(screen.queryByText(/Affiliate link/i)).toBeNull();
});

test("fallback variant: link does not have rel=sponsored", () => {
  render(
    <EsimPickCard
      providerName={null}
      bundleName={null}
      totalFormatted={null}
      countryName="Spain"
      affiliateUrl="https://airalo.com"
      disclosureRequired={false}
    />
  );
  const link = screen.getByRole("link", { name: /Check live eSIM prices/i }) as HTMLAnchorElement;
  expect(link.rel).not.toContain("sponsored");
});

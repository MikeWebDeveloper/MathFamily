import { describe, expect, it, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { roamingTripCost, type NetworkRoamingOption, type EsimBundleOption } from "@mathfamily/engine";
import { AffiliateBlock } from "../components/affiliate-block";
import type { ResolvedSlot } from "../lib/partners";
import { RoamingAnswerDisplay, buildHeroAnswer } from "../components/roaming-answer";

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const esimBundles: EsimBundleOption[] = [
  {
    provider: "Airalo",
    bundleName: "5GB/30d",
    dataGb: 5,
    validityDays: 30,
    totalPence: 1150,
    snapshotDate: "2026-06-10",
  },
];

const officialSlot: ResolvedSlot = {
  kind: "official",
  url: "https://www.airalo.com/spain-esim",
  label: "Check live prices on the official site",
  partnerName: null,
  disclosureRequired: false,
};

const affiliateSlot: ResolvedSlot = {
  kind: "affiliate",
  url: "https://awin1.com/cread.php?awinaffid=123&clickref=spain",
  label: "Check prices with Airalo",
  partnerName: "Airalo",
  disclosureRequired: true,
};

const networkWithPass: NetworkRoamingOption = {
  network: "ee",
  included: false,
  dailyPassPence: 259,
  passName: "EU Roaming Pass",
  fairUseNote: "50GB fair use",
};

const networkIncluded: NetworkRoamingOption = {
  network: "three",
  included: true,
  dailyPassPence: null,
  passName: null,
  fairUseNote: "12GB cap",
};

// ---------------------------------------------------------------------------
// Helper — renders at given days/dataGb (defaults to 7d/5GB like the page)
// ---------------------------------------------------------------------------

function renderDisplay(
  networkOption: NetworkRoamingOption,
  esimSlot: ResolvedSlot,
  days = 7,
  dataGb = 5,
  networkLabel = "EE",
  countryName = "Spain"
): string {
  const result = roamingTripCost([networkOption], esimBundles, days, dataGb);
  const heroAnswer = buildHeroAnswer(networkOption, networkLabel, countryName, days, result);
  return renderToStaticMarkup(
    RoamingAnswerDisplay({
      networkOption,
      networkLabel,
      countryName,
      days,
      dataGb,
      result,
      esimSlot,
      heroAnswer,
    })
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("RoamingAnswer SSR at defaults", () => {
  it("renders the hero answer with the network name and country at defaults (7d/5GB)", () => {
    const html = renderDisplay(networkWithPass, officialSlot);

    // Hero text should mention EE and Spain
    expect(html).toContain("EE");
    expect(html).toContain("Spain");
    // Should mention the daily charge (£2.59)
    expect(html).toContain("£2.59");
    // Should have a result region
    expect(html).toContain("data-testid=\"roaming-answer-result\"");
  });
});

describe("RoamingAnswer affiliate disclosure before CTA", () => {
  it("renders disclosure text BEFORE the affiliate CTA link", () => {
    const html = renderDisplay(networkWithPass, affiliateSlot);

    expect(html).toContain("data-testid=\"affiliate-disclosure\"");
    expect(html).toContain("data-testid=\"esim-cta\"");

    // Disclosure must appear before the CTA link in the markup
    const disclosureIdx = html.indexOf("data-testid=\"affiliate-disclosure\"");
    const ctaLinkIdx = html.indexOf("awin1.com");
    expect(disclosureIdx).toBeGreaterThan(-1);
    expect(ctaLinkIdx).toBeGreaterThan(-1);
    expect(disclosureIdx).toBeLessThan(ctaLinkIdx);
  });
});

describe("RoamingAnswer eSIM CTA absent when network is included", () => {
  it("does NOT render the eSIM CTA when networkOption.included is true", () => {
    const html = renderDisplay(networkIncluded, affiliateSlot, 7, 5, "Three");

    expect(html).not.toContain("data-testid=\"esim-cta\"");
  });

  it("renders 'no extra daily charge' in the hero when network is included", () => {
    const html = renderDisplay(networkIncluded, officialSlot, 7, 5, "Three");

    expect(html.toLowerCase()).toContain("no extra daily charge");
  });
});

describe("RoamingAnswer inert eSIM CTA", () => {
  it("renders an 'Ad' label + 'coming soon' framing when the slot is inert (official)", () => {
    const html = renderDisplay(networkWithPass, officialSlot);

    expect(html).toContain("data-testid=\"esim-cta\"");
    // Inert: no active affiliate, but pre-disclosed sponsored labelling
    expect(html).toContain("Ad");
    expect(html.toLowerCase()).toContain("coming soon");
    // Still links the user to the official provider page
    expect(html).toContain(officialSlot.url);
  });
});

describe("RoamingAnswer warnings / caveats", () => {
  it("renders warning caveats when eSIM snapshot warning is present", () => {
    const html = renderDisplay(networkWithPass, officialSlot);

    // The engine always emits ESIM_SNAPSHOT when esimBundles covers the trip
    expect(html.toLowerCase()).toContain("snapshot");
  });
});

// ---------------------------------------------------------------------------
// AffiliateBlock tests
// ---------------------------------------------------------------------------

test("AffiliateBlock renders fallback (official link) when all partners inactive", () => {
  const html = renderToStaticMarkup(
    <AffiliateBlock
      providerName="Airalo"
      countrySlug="spain"
      officialUrl="https://airalo.com/spain"
      bundleName="Spain 5GB"
      totalPence={1499}
      countryName="Spain"
    />
  );
  // All partners are active: false in partners.json, so fallback mode
  expect(html).toContain("Check live eSIM prices");
  expect(html).not.toContain("Affiliate link");
  expect(html).not.toContain("Best eSIM pick");
});

test("AffiliateBlock renders eSIM option section regardless", () => {
  const html = renderToStaticMarkup(
    <AffiliateBlock
      providerName={null}
      countrySlug="france"
      officialUrl="https://airalo.com/france"
      bundleName={null}
      totalPence={null}
      countryName="France"
    />
  );
  expect(html).toContain("Check live eSIM prices");
});

test("AffiliateBlock inert slot carries an 'Ad' label and 'coming soon' framing", () => {
  const html = renderToStaticMarkup(
    <AffiliateBlock
      providerName="Airalo"
      countrySlug="spain"
      officialUrl="https://airalo.com/spain"
      bundleName="Spain 5GB"
      totalPence={1499}
      countryName="Spain"
    />
  );
  // Inert (no live merchant IDs): tasteful sponsored labelling, no active affiliate link
  expect(html).toContain("Ad");
  expect(html.toLowerCase()).toContain("coming soon");
  expect(html).not.toContain("Affiliate link");
  expect(html).not.toContain("Best eSIM pick");
  // Still links to the official provider page for the user
  expect(html).toContain("https://airalo.com/spain");
});

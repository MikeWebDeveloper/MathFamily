import { describe, test, expect } from "vitest";
import {
  resolveSlot,
  resolveCarHireSlot,
  resolveTravelInsuranceSlot,
  buildAffiliateUrl,
  buildAwinLink,
} from "../lib/partners";

describe("buildAffiliateUrl", () => {
  test("substitutes {countrySlug} and {clickref}", () => {
    const url = buildAffiliateUrl(
      "https://airalo.com/esim/{countrySlug}?click={clickref}",
      "spain"
    );
    expect(url).toBe("https://airalo.com/esim/spain?click=esim-spain");
  });

  test("handles template with only countrySlug", () => {
    const url = buildAffiliateUrl("https://example.com/{countrySlug}", "france");
    expect(url).toBe("https://example.com/france");
  });

  test("handles template with no placeholders", () => {
    const url = buildAffiliateUrl("https://example.com/store", "germany");
    expect(url).toBe("https://example.com/store");
  });
});

describe("resolveSlot", () => {
  const officialUrl = "https://airalo.com";

  test("returns official fallback when providerName is null", () => {
    const result = resolveSlot(null, "spain", officialUrl);
    expect(result.kind).toBe("official");
    expect(result.url).toBe(officialUrl);
    expect(result.disclosureRequired).toBe(false);
    expect(result.partnerName).toBeNull();
  });

  test("returns official fallback for unknown provider name", () => {
    const result = resolveSlot("UnknownProvider", "spain", officialUrl);
    expect(result.kind).toBe("official");
    expect(result.url).toBe(officialUrl);
  });

  test("returns official fallback when partner is inactive (real JSON has active: false)", () => {
    const result = resolveSlot("Airalo", "spain", officialUrl);
    expect(result.kind).toBe("official");
  });

  test("returns official fallback when provider name is empty string", () => {
    const result = resolveSlot("", "spain", officialUrl);
    expect(result.kind).toBe("official");
  });

  test("official fallback label is 'Check live eSIM prices'", () => {
    const result = resolveSlot(null, "spain", officialUrl);
    expect(result.label).toBe("Check live eSIM prices");
  });
});

describe("buildAwinLink", () => {
  test("builds a bare cread.php link with clickref and no destination", () => {
    expect(
      buildAwinLink({ awinmid: "3496", publisherId: "999999", clickref: "car-hire-spain" })
    ).toBe("https://www.awin1.com/cread.php?awinmid=3496&awinaffid=999999&clickref=car-hire-spain");
  });

  test("percent-encodes a destination URL so its own query string cannot leak into the outer AWIN query", () => {
    // Mirrors a realistic RentalCars-style destination: multiple params, own "&" and "=".
    const url = buildAwinLink({
      awinmid: "5547",
      publisherId: "999999",
      clickref: "car-hire-spain",
      destinationUrl: "https://www.rentalcars.com/SearchResults.do?country=spain&pickupDate=2026-08-01",
    });
    expect(url).toContain(
      "ued=https%3A%2F%2Fwww.rentalcars.com%2FSearchResults.do%3Fcountry%3Dspain%26pickupDate%3D2026-08-01"
    );
    // awinmid, awinaffid, clickref, ued — the destination's own "&" must be encoded, not a 5th top-level param.
    expect(url.split("&")).toHaveLength(4);
  });

  test("omits ued entirely when no destination is given", () => {
    const url = buildAwinLink({ awinmid: "1250", publisherId: "999999", clickref: "travel-insurance-france" });
    expect(url).not.toContain("ued=");
  });
});

describe("resolveCarHireSlot", () => {
  test("returns official fallback (kind='official') when no car-hire partner is active", () => {
    // Both discoverCars and rentalCars are active: false in partners.json
    const result = resolveCarHireSlot("spain");
    expect(result.kind).toBe("official");
    expect(result.disclosureRequired).toBe(false);
    expect(result.partnerName).toBeNull();
    expect(result.url).toBe("");
  });

  test("returns official fallback for any country slug when inactive", () => {
    const result = resolveCarHireSlot("france");
    expect(result.kind).toBe("official");
    expect(result.disclosureRequired).toBe(false);
  });

  test("label is empty when no active partner", () => {
    const result = resolveCarHireSlot("germany");
    expect(result.label).toBe("");
  });
});

describe("resolveTravelInsuranceSlot", () => {
  test("returns official fallback (kind='official') when no travel-insurance partner is active", () => {
    // Both coverForYou and holidayExtras are active: false in partners.json
    const result = resolveTravelInsuranceSlot("spain");
    expect(result.kind).toBe("official");
    expect(result.disclosureRequired).toBe(false);
    expect(result.partnerName).toBeNull();
    expect(result.url).toBe("");
  });

  test("returns official fallback for any country slug when inactive", () => {
    const result = resolveTravelInsuranceSlot("france");
    expect(result.kind).toBe("official");
    expect(result.disclosureRequired).toBe(false);
  });

  test("label is empty when no active partner", () => {
    const result = resolveTravelInsuranceSlot("germany");
    expect(result.label).toBe("");
  });
});

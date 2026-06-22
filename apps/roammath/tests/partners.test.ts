import { describe, test, expect } from "vitest";
import { resolveSlot, buildAffiliateUrl, buildGoHref, resolveDeeplink } from "../lib/partners";

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

describe("buildGoHref", () => {
  test("builds a first-party /go href with provider, country slug and surface", () => {
    expect(buildGoHref("Airalo", "spain", "network")).toBe("/go/esim/airalo/spain?s=network");
  });

  test("lowercases + url-encodes the provider and omits the query when no surface", () => {
    expect(buildGoHref("Holafly", "france", "")).toBe("/go/esim/holafly/france");
  });
});

describe("resolveDeeplink (/go resolver)", () => {
  test("returns null for non-esim path kinds (fail closed)", () => {
    expect(resolveDeeplink(["baggage", "ryanair"], "airline")).toBeNull();
  });

  test("returns null when parts are incomplete", () => {
    expect(resolveDeeplink(["esim"], "country")).toBeNull();
    expect(resolveDeeplink(["esim", "airalo"], "country")).toBeNull();
  });

  test("returns null for an unknown provider", () => {
    expect(resolveDeeplink(["esim", "nope", "spain"], "network")).toBeNull();
  });

  test("returns null while every partner is inert (active: false in partners.json)", () => {
    // The whole eSIM rail is intentionally INERT today — no live deeplink, fail closed.
    expect(resolveDeeplink(["esim", "airalo", "spain"], "network")).toBeNull();
    expect(resolveDeeplink(["esim", "holafly", "france"], "country")).toBeNull();
    expect(resolveDeeplink(["esim", "saily", "italy"], "network")).toBeNull();
  });
});

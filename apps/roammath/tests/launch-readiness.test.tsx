import { afterEach, describe, expect, test, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PRODUCTION_SITE_URL, CONTACT_EMAIL, siteUrl } from "../lib/site";
import robots from "../app/robots";
import sitemap from "../app/sitemap";
import AboutPage from "../app/about/page";
import AffiliateDisclosurePage from "../app/affiliate-disclosure/page";
import PrivacyPage from "../app/privacy/page";
import partnersJson from "../lib/partners.json";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("siteUrl", () => {
  test("defaults to the www production origin when the env var is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    expect(siteUrl()).toBe("https://www.roammath.co.uk");
    expect(PRODUCTION_SITE_URL).toBe("https://www.roammath.co.uk");
  });

  test("an empty or whitespace env value never reaches new URL() as an empty string", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "   ");
    expect(() => new URL(siteUrl())).not.toThrow();
    expect(siteUrl()).toBe(PRODUCTION_SITE_URL);
  });

  test("honours an explicit override and strips trailing slashes", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://preview.example.test///");
    expect(siteUrl()).toBe("https://preview.example.test");
  });
});

describe("robots.txt", () => {
  test("points the sitemap at the canonical host", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    expect(robots().sitemap).toBe("https://www.roammath.co.uk/sitemap.xml");
  });

  test("keeps /go/ (affiliate redirect) away from every crawler group, including the named AI bots", () => {
    const rules = [robots().rules].flat();
    expect(rules.length).toBeGreaterThan(1);
    for (const rule of rules) {
      expect(rule.allow).toBe("/");
      expect(rule.disallow).toEqual(["/go/"]);
    }
  });
});

describe("sitemap.xml", () => {
  test("every URL is on the canonical host (no localhost / vercel.app leakage)", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    const urls = sitemap().map((e) => e.url);
    expect(urls.length).toBeGreaterThan(100);
    for (const url of urls) {
      expect(url.startsWith("https://www.roammath.co.uk")).toBe(true);
      expect(url).not.toMatch(/localhost|vercel\.app/);
    }
  });

  test("lists the trust pages, the eSIM-bearing roaming index and never /go/", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    const urls = sitemap().map((e) => e.url);
    for (const path of ["/roaming", "/baggage-fees", "/methodology", "/about", "/affiliate-disclosure", "/privacy"]) {
      expect(urls).toContain(`https://www.roammath.co.uk${path}`);
    }
    expect(urls.some((u) => u.includes("/go/"))).toBe(false);
  });
});

describe("trust pages", () => {
  test("about page names the operator, states commission-blind independence and links the disclosure", () => {
    const html = renderToStaticMarkup(<AboutPage />);
    expect(html).toContain("Michal Latal");
    expect(html).toContain("commission-blind");
    expect(html).toContain('href="/affiliate-disclosure"');
    expect(html).toContain(`mailto:${CONTACT_EMAIL}`);
  });

  test("affiliate disclosure explains the label and that rankings are not affected", () => {
    const html = renderToStaticMarkup(<AffiliateDisclosurePage />);
    expect(html).toContain("Affiliate link");
    expect(html).toContain("cheapest");
    expect(html).toContain('href="/privacy"');
  });

  test("privacy page has a real contact and does not carry ParkMath-only claims", () => {
    const html = renderToStaticMarkup(<PrivacyPage />);
    expect(html).toContain(`mailto:${CONTACT_EMAIL}`);
    expect(html).not.toMatch(/ParkMath|parkmath|airport drop-off/i);
    expect(html).not.toContain("will be published when the operating company is registered");
  });
});

describe("partners.json launch invariants", () => {
  type Awin = { active: boolean; awinmid: string; destinationTemplate: string };
  type Esim = { active: boolean; deeplinkTemplate: string };
  const cfg = partnersJson as unknown as {
    esim: Record<string, Esim>;
    awin: { publisherId: string };
    "car-hire": Record<string, Awin>;
    "travel-insurance": Record<string, Awin>;
  };
  const awinPartners = Object.entries({ ...cfg["car-hire"], ...cfg["travel-insurance"] });

  test("the shared AWIN publisher id is numeric", () => {
    expect(cfg.awin.publisherId).toMatch(/^\d+$/);
  });

  test("any awinmid that is filled in is a numeric AWIN merchant id", () => {
    for (const [id, p] of awinPartners) {
      if (p.awinmid !== "") expect(p.awinmid, id).toMatch(/^\d+$/);
    }
  });

  test("an active partner is fully wired (cannot go live half-configured)", () => {
    for (const [id, p] of awinPartners) {
      if (p.active) {
        expect(p.awinmid, id).toMatch(/^\d+$/);
        expect(p.destinationTemplate.startsWith("https://"), id).toBe(true);
      }
    }
    for (const [id, p] of Object.entries(cfg.esim)) {
      if (p.active) expect(p.deeplinkTemplate.startsWith("https://"), id).toBe(true);
    }
  });
});

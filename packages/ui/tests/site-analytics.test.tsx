// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { SiteAnalytics } from "../src/site-analytics";

afterEach(() => { cleanup(); vi.unstubAllEnvs(); });

describe("SiteAnalytics", () => {
  it("renders nothing when no analytics env vars are set", () => {
    vi.stubEnv("NEXT_PUBLIC_CF_BEACON_TOKEN", "");
    vi.stubEnv("NEXT_PUBLIC_AWIN_PUBLISHER_ID", "");
    vi.stubEnv("NEXT_PUBLIC_PLAUSIBLE_DOMAIN", "");
    const { container } = render(<SiteAnalytics />);
    expect(container.innerHTML).toBe("");
  });
  it("renders the Cloudflare beacon script with the token when set", () => {
    vi.stubEnv("NEXT_PUBLIC_CF_BEACON_TOKEN", "abc123");
    vi.stubEnv("NEXT_PUBLIC_AWIN_PUBLISHER_ID", "");
    const { container } = render(<SiteAnalytics />);
    const s = container.querySelector('script[src*="cloudflareinsights"]');
    expect(s).not.toBeNull();
    expect(s!.getAttribute("data-cf-beacon")).toContain("abc123");
  });
  it("renders the AWIN MasterTag script when the publisher id is set", () => {
    vi.stubEnv("NEXT_PUBLIC_CF_BEACON_TOKEN", "");
    vi.stubEnv("NEXT_PUBLIC_AWIN_PUBLISHER_ID", "2932035");
    const { container } = render(<SiteAnalytics />);
    const s = container.querySelector('script[src*="dwin1.com"]');
    expect(s).not.toBeNull();
    expect(s!.getAttribute("src")).toBe("https://www.dwin1.com/2932035.js");
  });
  it("renders the Plausible beacon (default cloud host) when the domain is set", () => {
    vi.stubEnv("NEXT_PUBLIC_CF_BEACON_TOKEN", "");
    vi.stubEnv("NEXT_PUBLIC_AWIN_PUBLISHER_ID", "");
    vi.stubEnv("NEXT_PUBLIC_PLAUSIBLE_DOMAIN", "parkmath.co.uk");
    vi.stubEnv("NEXT_PUBLIC_PLAUSIBLE_HOST", "");
    const { container } = render(<SiteAnalytics />);
    const s = container.querySelector('script[data-domain="parkmath.co.uk"]');
    expect(s).not.toBeNull();
    expect(s!.getAttribute("src")).toBe("https://plausible.io/js/script.outbound-links.tagged-events.js");
  });
  it("uses a self-hosted Plausible host (trailing slash trimmed) when configured", () => {
    vi.stubEnv("NEXT_PUBLIC_CF_BEACON_TOKEN", "");
    vi.stubEnv("NEXT_PUBLIC_AWIN_PUBLISHER_ID", "");
    vi.stubEnv("NEXT_PUBLIC_PLAUSIBLE_DOMAIN", "parkmath.co.uk");
    vi.stubEnv("NEXT_PUBLIC_PLAUSIBLE_HOST", "https://plausible.parkmath.co.uk/");
    const { container } = render(<SiteAnalytics />);
    const s = container.querySelector('script[data-domain="parkmath.co.uk"]');
    expect(s!.getAttribute("src")).toBe("https://plausible.parkmath.co.uk/js/script.outbound-links.tagged-events.js");
  });
});

// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { SiteAnalytics } from "../src/site-analytics";

afterEach(() => { cleanup(); vi.unstubAllEnvs(); });

describe("SiteAnalytics", () => {
  it("renders nothing when the beacon token is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_CF_BEACON_TOKEN", "");
    const { container } = render(<SiteAnalytics />);
    expect(container.innerHTML).toBe("");
  });
  it("renders the Cloudflare beacon script with the token when set", () => {
    vi.stubEnv("NEXT_PUBLIC_CF_BEACON_TOKEN", "abc123");
    const { container } = render(<SiteAnalytics />);
    const s = container.querySelector("script");
    expect(s).not.toBeNull();
    expect(s!.getAttribute("src")).toContain("static.cloudflareinsights.com/beacon.min.js");
    expect(s!.getAttribute("data-cf-beacon")).toContain("abc123");
  });
});

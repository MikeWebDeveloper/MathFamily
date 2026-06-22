import { describe, it, expect, vi } from "vitest";
import { logAffiliateClick, createGoRoute } from "../src/affiliate-click";

describe("logAffiliateClick", () => {
  it("emits ONE structured JSON line tagged with brand + surface + slug parts", () => {
    const log = vi.fn();
    logAffiliateClick({ brand: "RoamMath", surface: "home", parts: ["o2", "spain"] }, log);
    expect(log).toHaveBeenCalledOnce();
    const payload = JSON.parse(log.mock.calls[0]![0]);
    expect(payload.event).toBe("affiliate_click");
    expect(payload.brand).toBe("RoamMath");
    expect(payload.surface).toBe("home");
    expect(payload.target).toBe("o2/spain");
    expect(typeof payload.ts).toBe("string");
  });

  it("normalises a missing surface to null (privacy-friendly: no PII, no cookies)", () => {
    const log = vi.fn();
    logAffiliateClick({ brand: "RoamMath", surface: "", parts: ["x"] }, log);
    expect(JSON.parse(log.mock.calls[0]![0]).surface).toBeNull();
  });
});

describe("createGoRoute", () => {
  const make = (resolve: (parts: string[], surface: string) => string | null, log = vi.fn()) =>
    createGoRoute({ brand: "RoamMath", resolveDeeplink: resolve, log });

  const req = (url: string) => new Request(url);
  const params = (parts: string[]) => Promise.resolve({ go: parts });

  it("302-redirects to the resolved deeplink and logs the click (fail-closed → live link)", async () => {
    const log = vi.fn();
    const GET = make(() => "https://awin.example/deeplink", log);
    const res = await GET(req("https://roammath.co.uk/go/o2/spain?s=home"), { params: params(["o2", "spain"]) });
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("https://awin.example/deeplink");
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(log).toHaveBeenCalledOnce();
    expect(JSON.parse(log.mock.calls[0]![0]).surface).toBe("home");
  });

  it("inert-safe: with NO live deeplink it STILL logs intent and returns to an on-site page (never a broken redirect)", async () => {
    const log = vi.fn();
    const GET = make(() => null, log);
    const res = await GET(req("https://roammath.co.uk/go/o2/spain?s=region"), { params: params(["o2", "spain"]) });
    // Logged the intent even though there's no deeplink.
    expect(log).toHaveBeenCalledOnce();
    expect(JSON.parse(log.mock.calls[0]![0]).surface).toBe("region");
    // 302 back to an on-site page, NOT a 404 and NOT an external broken link.
    expect(res.status).toBe(302);
    const loc = res.headers.get("Location")!;
    expect(loc.startsWith("https://roammath.co.uk")).toBe(true);
  });

  it("never produces an open redirect — the fallback stays on our own origin", async () => {
    const GET = make(() => null);
    const res = await GET(req("https://roammath.co.uk/go/o2/spain"), { params: params(["o2", "spain"]) });
    const loc = new URL(res.headers.get("Location")!);
    expect(loc.origin).toBe("https://roammath.co.uk");
  });

  it("passes the parts + surface through to the resolver so per-app attribution params survive", async () => {
    const resolve = vi.fn(() => "https://awin.example/x");
    const GET = make(resolve);
    await GET(req("https://roammath.co.uk/go/o2/spain?s=spoke"), { params: params(["o2", "spain"]) });
    expect(resolve).toHaveBeenCalledWith(["o2", "spain"], "spoke");
  });
});

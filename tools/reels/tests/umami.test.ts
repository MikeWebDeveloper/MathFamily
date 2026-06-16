import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { umamiReach } from "../src/analytics/umami";

const ENV = ["UMAMI_HOST", "UMAMI_WEBSITE_ID", "UMAMI_USER", "UMAMI_PASSWORD"];

describe("umamiReach", () => {
  beforeEach(() => {
    process.env.UMAMI_HOST = "http://umami.test";
    process.env.UMAMI_WEBSITE_ID = "wid-1";
    process.env.UMAMI_USER = "admin";
    process.env.UMAMI_PASSWORD = "pw";
  });
  afterEach(() => {
    for (const k of ENV) delete process.env[k];
    vi.unstubAllGlobals();
  });

  it("returns null when not configured", async () => {
    delete process.env.UMAMI_WEBSITE_ID;
    expect(await umamiReach(7)).toBeNull();
  });

  it("logs in, returns path rows + per-campaign rows, and keeps the token secret in the header", async () => {
    const calls: string[] = [];
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      calls.push(url);
      if (url.endsWith("/api/auth/login")) {
        return new Response(JSON.stringify({ token: "TKN" }), { status: 200 });
      }
      // every authed call must carry the bearer token
      expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer TKN");
      if (url.includes("/metrics?type=path")) {
        return new Response(JSON.stringify([{ x: "/drop-off-charges/heathrow", y: 12 }, { x: "/", y: 30 }]), { status: 200 });
      }
      if (url.includes("utmCampaign=reel-shock-heathrow")) {
        return new Response(JSON.stringify({ visitors: 7 }), { status: 200 });
      }
      // other campaigns: zero visitors → must NOT produce a row
      return new Response(JSON.stringify({ visitors: 0 }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const rows = await umamiReach(7, ["reel-shock-heathrow", "reel-howto-gatwick"]);
    expect(rows).not.toBeNull();
    // 2 path rows + 1 non-zero campaign row (the zero-visitor campaign is dropped)
    expect(rows!).toEqual([
      { key: "/drop-off-charges/heathrow", visitors: 12 },
      { key: "/", visitors: 30 },
      { key: "reel-shock-heathrow", visitors: 7 }
    ]);
    expect(calls[0]).toBe("http://umami.test/api/auth/login");
  });

  it("throws a clear error when login fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 401 })));
    await expect(umamiReach(7)).rejects.toThrow(/Umami login 401/);
  });
});

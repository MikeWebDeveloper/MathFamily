import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { _resetDedupeStateForTests, _resetVelocityStateForTests } from "../lib/go-bot-filter";

// route.ts defers the Umami POST past the redirect response via next/server's `after()`, which relies
// on Next's real request-scope AsyncLocalStorage and throws ("after() was called outside a request
// scope") outside that runtime — exactly the situation this plain vitest run is in. Mock it to run its
// callback immediately (capturing the promise via vi.hoisted so the test can await it) so the route's
// actual, UNMODIFIED `recordUmamiClick` logic still executes and can be asserted against.
const hoisted = vi.hoisted(() => ({ lastAfterPromise: undefined as Promise<unknown> | undefined }));
vi.mock("next/server", () => ({
  after: (fn: () => void | Promise<void>) => {
    hoisted.lastAfterPromise = Promise.resolve(fn());
  },
}));

// route.ts reads NEXT_PUBLIC_UMAMI_HOST/WEBSITE_ID into module-level constants at import time, so these
// must be set before the dynamic import below resolves the module.
process.env.NEXT_PUBLIC_UMAMI_HOST = "https://stats.parkmath.co.uk";
process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID = "test-website-id";

const { GET } = await import("../app/go/[airport]/[target]/route");

// A real Chrome-on-macOS click shape — same fixture pattern as go-bot-filter.test.ts's REAL_CHROME_CLICK
// (must pass isLikelyBot so recordUmamiClick reaches the fetch() call this test asserts against).
const REAL_CLICK_HEADERS: Record<string, string> = {
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  host: "www.parkmath.co.uk",
  "accept-language": "en-GB,en;q=0.9",
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "same-origin",
};

function buildRequest(headers: Record<string, string>, xff: string): Request {
  return new Request("https://www.parkmath.co.uk/go/gatwick/parking", {
    headers: { ...headers, "x-forwarded-for": xff },
  });
}

describe("GET /go/[airport]/[target] — secFetchUser flows into the Umami click payload (2026-07-12 patch)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Independent fingerprint-keyed state (dedupe + velocity, both module-level Maps in go-bot-filter.ts)
    // must be reset between tests, same convention as go-bot-filter.test.ts.
    _resetDedupeStateForTests();
    _resetVelocityStateForTests();
    fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('records data.secFetchUser: "?1" when the browser sends Sec-Fetch-User: ?1 (a real user-activated click)', async () => {
    const req = buildRequest({ ...REAL_CLICK_HEADERS, "sec-fetch-user": "?1" }, "81.174.10.21");
    await GET(req, { params: Promise.resolve({ airport: "gatwick", target: "parking" }) });
    await hoisted.lastAfterPromise;

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.payload.data.secFetchUser).toBe("?1");
    // The existing fields must still be present alongside the new one (additive, not a replacement).
    expect(body.payload.data.airport).toBe("gatwick");
    expect(body.payload.data.target).toBe("parking");
  });

  it('records data.secFetchUser: "0" when the header is absent — matches the `?? "0"` fallback', async () => {
    const req = buildRequest(REAL_CLICK_HEADERS, "81.174.10.22"); // no sec-fetch-user header at all
    await GET(req, { params: Promise.resolve({ airport: "gatwick", target: "parking" }) });
    await hoisted.lastAfterPromise;

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.payload.data.secFetchUser).toBe("0");
  });

  it("Signal A end-to-end: a cross-site hit still 302-redirects but is dropped from the Umami count (zero fetch calls)", async () => {
    // The redirect must be completely unaffected by the bot gate — only the metric is gated. This
    // proves that end-to-end at the route level, not just at the isLikelyBot unit-test level above.
    const req = buildRequest({ ...REAL_CLICK_HEADERS, "sec-fetch-site": "cross-site" }, "81.174.10.23");
    const res = await GET(req, { params: Promise.resolve({ airport: "gatwick", target: "parking" }) });
    await hoisted.lastAfterPromise;

    expect(res.status).toBe(302); // redirect still fires — conversion path is never affected
    expect(res.headers.get("location")).toContain("awin1.com");
    expect(fetchMock).not.toHaveBeenCalled(); // but the click is dropped from the Umami count
  });
});

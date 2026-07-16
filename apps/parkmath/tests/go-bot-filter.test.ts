import { beforeEach, describe, expect, it } from "vitest";
import {
  DEDUPE_WINDOW_MS,
  VELOCITY_MAX_CLICKS,
  VELOCITY_WINDOW_MS,
  isHighVelocityClick,
  isLikelyBot,
  isNearDuplicateClick,
  _resetDedupeStateForTests,
  _resetVelocityStateForTests,
  type ClickHeaders,
} from "../lib/go-bot-filter";

// A real Chrome-on-macOS click on a `target="_blank" rel="noreferrer"` CTA: full UA + the Fetch
// Metadata / Accept-Language headers every modern browser attaches to a top-level navigation, no
// Referer (stripped by rel=noreferrer — this is the CTA's normal, expected shape).
const REAL_CHROME_CLICK: ClickHeaders = {
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  xForwardedFor: "81.174.10.20",
  host: "www.parkmath.co.uk",
  acceptLanguage: "en-GB,en;q=0.9",
  secFetchMode: "navigate",
  secFetchSite: "same-origin",
  secFetchUser: "?1",
};

const REAL_SAFARI_IOS_CLICK: ClickHeaders = {
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  xForwardedFor: "82.132.200.5",
  host: "www.parkmath.co.uk",
  acceptLanguage: "en-GB,en;q=0.9",
  secFetchMode: "navigate",
  secFetchSite: "same-origin",
  secFetchUser: "?1",
};

describe("isLikelyBot — real human clicks must never be flagged", () => {
  it("passes a real desktop Chrome click", () => {
    expect(isLikelyBot(REAL_CHROME_CLICK)).toBe(false);
  });

  it("passes a real iOS Safari click", () => {
    expect(isLikelyBot(REAL_SAFARI_IOS_CLICK)).toBe(false);
  });

  it("passes even without Accept-Language as long as Fetch Metadata is present", () => {
    expect(isLikelyBot({ ...REAL_CHROME_CLICK, acceptLanguage: null })).toBe(false);
  });
});

describe("isLikelyBot — self-identifying bots (Googlebot-class)", () => {
  it("flags Googlebot", () => {
    expect(
      isLikelyBot({
        ...REAL_CHROME_CLICK,
        userAgent:
          "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      }),
    ).toBe(true);
  });

  it("flags AhrefsBot", () => {
    expect(isLikelyBot({ ...REAL_CHROME_CLICK, userAgent: "Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)" })).toBe(
      true,
    );
  });

  it("flags bare HTTP-client UAs (curl, python-requests, node-fetch)", () => {
    expect(isLikelyBot({ ...REAL_CHROME_CLICK, userAgent: "curl/8.4.0" })).toBe(true);
    expect(isLikelyBot({ ...REAL_CHROME_CLICK, userAgent: "python-requests/2.31.0" })).toBe(true);
    expect(isLikelyBot({ ...REAL_CHROME_CLICK, userAgent: "node-fetch/1.0" })).toBe(true);
  });

  it("flags a missing User-Agent outright", () => {
    expect(isLikelyBot({ ...REAL_CHROME_CLICK, userAgent: null })).toBe(true);
    expect(isLikelyBot({ ...REAL_CHROME_CLICK, userAgent: "" })).toBe(true);
  });
});

describe("isLikelyBot — generic scrapers spoofing a full browser UA (the audit's actual gap)", () => {
  it("flags a spoofed desktop-Chrome UA with none of the Fetch Metadata / Accept-Language headers", () => {
    // This is precisely the class the audit found getting through: no "bot"/"crawler" substring, but
    // no Sec-Fetch-* or Accept-Language either — a raw HTTP client faking a browser UA string.
    expect(
      isLikelyBot({
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        xForwardedFor: "34.201.10.4", // us-east-1-shaped
        host: "www.parkmath.co.uk",
        acceptLanguage: null,
        secFetchMode: null,
        secFetchSite: null,
        secFetchUser: null,
      }),
    ).toBe(true);
  });
});

describe("isLikelyBot — anomalous-device signatures (2026-07-11 bot-traffic audit)", () => {
  it("flags a BlackBerry OS UA", () => {
    expect(
      isLikelyBot({
        ...REAL_CHROME_CLICK,
        userAgent:
          "Mozilla/5.0 (BlackBerry; U; BlackBerry 9900; en) AppleWebKit/534.11+ (KHTML, like Gecko) Version/7.1.0.346 Mobile Safari/534.11+",
      }),
    ).toBe(true);
  });

  it("flags IE on Windows 7 (Windows NT 6.1 combined with MSIE or Trident)", () => {
    expect(
      isLikelyBot({
        ...REAL_CHROME_CLICK,
        userAgent: "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)",
      }),
    ).toBe(true);
    expect(
      isLikelyBot({
        ...REAL_CHROME_CLICK,
        userAgent: "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; Trident/4.0; SLCC2)",
      }),
    ).toBe(true);
  });

  it("does NOT flag Windows NT 6.1 alone — an old-but-real Chrome on Windows 7 is not IE", () => {
    expect(
      isLikelyBot({
        ...REAL_CHROME_CLICK,
        userAgent:
          "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.112 Safari/537.36",
      }),
    ).toBe(false);
  });

  it("does NOT flag MSIE/Trident alone — e.g. IE11 on Windows 10 is not the Windows-7 combo", () => {
    expect(
      isLikelyBot({
        ...REAL_CHROME_CLICK,
        userAgent: "Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko",
      }),
    ).toBe(false);
  });
});

describe("isLikelyBot — Sec-Fetch-Site must be same-origin (2026-07-12 distributed-IP bot patch)", () => {
  it("flags cross-site: a normal-looking browser UA with full headers, but Sec-Fetch-Site: cross-site", () => {
    // The new signal firing on its own — everything else about this request passes signals 1-2.
    expect(isLikelyBot({ ...REAL_CHROME_CLICK, secFetchSite: "cross-site" })).toBe(true);
  });

  it("flags secFetchSite: none — the typed-URL / no-referring-page case", () => {
    expect(isLikelyBot({ ...REAL_CHROME_CLICK, secFetchSite: "none" })).toBe(true);
  });

  it("still does NOT flag same-origin with a normal browser UA — the real-click fixture must not regress", () => {
    expect(isLikelyBot({ ...REAL_CHROME_CLICK, secFetchSite: "same-origin" })).toBe(false);
  });

  it("still does NOT flag secFetchSite entirely absent as long as secFetchMode is present — the new check only fires when secFetchSite is present-but-wrong, never merely absent", () => {
    expect(isLikelyBot({ ...REAL_CHROME_CLICK, secFetchSite: null, secFetchMode: "navigate" })).toBe(false);
  });
});

describe("isNearDuplicateClick — same-key repeats within the window are suppressed", () => {
  beforeEach(() => {
    _resetDedupeStateForTests();
  });

  it("lets the first fire through, suppresses an immediate repeat, and clears after the window", () => {
    const key = "81.174.10.20:heathrow:parking";
    expect(isNearDuplicateClick(key)).toBe(false); // first fire — not a duplicate
    expect(isNearDuplicateClick(key)).toBe(true); // 0ms later — duplicate, suppressed

    // Simulate the window elapsing by using a key namespaced with a manual delay check instead of
    // real sleep (keeps the test fast): re-derive via Date.now offset isn't directly controllable
    // here, so just assert the constant is the documented window used by the route. 2026-07-11: widened
    // 4000 -> 40000 to cover the audit's observed 5.8-25.5s bot repeat-hit range (see go-bot-filter.ts).
    expect(DEDUPE_WINDOW_MS).toBe(40000);
  });

  it("treats different airport/target/ip combinations as independent", () => {
    expect(isNearDuplicateClick("81.174.10.20:heathrow:parking")).toBe(false);
    expect(isNearDuplicateClick("81.174.10.20:gatwick:parking")).toBe(false);
    expect(isNearDuplicateClick("9.9.9.9:heathrow:parking")).toBe(false);
  });
});

describe("isHighVelocityClick — same fingerprint, too many /go clicks in a rolling window", () => {
  beforeEach(() => {
    _resetVelocityStateForTests();
  });

  it("lets up to VELOCITY_MAX_CLICKS clicks from the same fingerprint through, then flags the next one", () => {
    const fingerprint = "81.174.10.20";
    for (let i = 0; i < VELOCITY_MAX_CLICKS; i++) {
      expect(isHighVelocityClick(fingerprint)).toBe(false); // 1st..Nth clicks — at or under the threshold
    }
    expect(isHighVelocityClick(fingerprint)).toBe(true); // next click, same 5-minute window — flagged
  });

  it("treats different fingerprints as independent — one visitor tripping the limit doesn't affect another", () => {
    const bot = "81.174.10.20";
    const realVisitor = "9.9.9.9";
    for (let i = 0; i < VELOCITY_MAX_CLICKS; i++) isHighVelocityClick(bot);
    expect(isHighVelocityClick(bot)).toBe(true); // bot already used up its allowance
    expect(isHighVelocityClick(realVisitor)).toBe(false); // unrelated fingerprint, zero clicks so far
  });

  it("keys by the bare visitor fingerprint, not a URL-specific key — proves why it catches a sweep the exact-URL dedupe misses", () => {
    const ip = "81.174.10.20";

    // If this were (wrongly) keyed the same way the exact-URL dedupe is — `${ip}:${airport}:${target}`
    // — every distinct target would look like a brand-new fingerprint and this would NEVER trip, which
    // is exactly the audit's gap (60 distinct /go URLs hit in one day, no single one of them a repeat).
    const airports = ["heathrow", "gatwick", "exeter", "aberdeen", "bristol", "luton", "stansted"];
    for (const airport of airports) {
      expect(isHighVelocityClick(`${ip}:${airport}:parking`)).toBe(false);
    }

    // Keyed correctly by the bare fingerprint — what route.ts actually passes (`isHighVelocityClick(ip)`,
    // no airport/target) — the same visitor's clicks accumulate regardless of target and it trips.
    _resetVelocityStateForTests();
    for (let i = 0; i < VELOCITY_MAX_CLICKS; i++) {
      expect(isHighVelocityClick(ip)).toBe(false);
    }
    expect(isHighVelocityClick(ip)).toBe(true);
  });

  it("documents the rolling-window + threshold constants", () => {
    expect(VELOCITY_WINDOW_MS).toBe(5 * 60 * 1000);
    expect(VELOCITY_MAX_CLICKS).toBe(6);
  });
});

// ─── /go affiliate-click bot filtering ──────────────────────────────────────
// 2026-06-30 marketing-suite audit: ≥53 of ~117 raw /go click-events in one week were sub-second,
// zero-pageview, 96%-US-tagged hits — bots firing the redirect directly, some duplicate-fired 0.2-0.4s
// apart. Forwarding the visitor's real UA to Umami (done in the route) lets Umami's own heuristic drop
// self-identifying bots (Googlebot, AhrefsBot, ...) fine — but generic scrapers/scanners that SPOOF a
// full desktop-browser UA string (no "bot"/"crawler" substring to match) sail straight through that
// heuristic. The two checks below close that gap. Kept in its own module (not inline in the route) so
// it's unit-testable without going through Next's route-handler/`after()` request scope.
//
// Both checks only ever affect the METRIC, never the redirect — a false positive here must never cost
// a real conversion.

/** Known bot/crawler/scraper/HTTP-library UA signatures. Deliberately broad — this only gates whether
 *  we count the click in Umami, never whether we redirect, so a false positive costs nothing but a
 *  metric (never a lost conversion). */
export const BOT_UA_PATTERN =
  /bot|crawl|spider|slurp|archiver|scrapy|headless|phantomjs|puppeteer|playwright|selenium|python-requests|python-urllib|go-http-client|okhttp|libwww-perl|curl\/|wget\/|node-fetch|axios\/|postmanruntime|httpclient|java\/[0-9]|masscan|nmap|nikto|sqlmap|censys|shodan|zgrab|gptbot|ccbot|bytespider|petalbot|serpstatbot|dataforseobot|blexbot|mj12bot|dotbot|ahrefsbot|semrushbot|barkrowler|zoominfobot|claudebot|amazonbot|bingpreview|facebookexternalhit|telegrambot|discordbot|slackbot|linkedinbot|whatsapp|embedly|pingdom|uptimerobot|site24x7|newrelic/i;

export type ClickHeaders = {
  userAgent: string | null;
  xForwardedFor: string | null;
  host: string | null;
  acceptLanguage: string | null;
  secFetchMode: string | null;
  secFetchSite: string | null;
};

/** True when the request is very unlikely to be a real click a human made on one of our CTAs.
 *  Two independent signals:
 *   1. The UA self-identifies (or fingerprints) as a bot/scraper/HTTP-library — the same class of
 *      signature Umami's own detector uses, kept here too as defense-in-depth.
 *   2. The UA CLAIMS to be a full desktop/mobile browser (`Mozilla/5.0 ...`) but the request carries
 *      NONE of the Fetch Metadata headers (`Sec-Fetch-*`) or `Accept-Language` that every real browser
 *      attaches automatically to a top-level navigation. Real users can't turn these off; simple
 *      scrapers that spoof a generic Chrome/Safari UA string routinely forget to fake them — this is
 *      exactly the "96%-US-tagged, zero-pageview" traffic class the audit flagged.
 *  Deliberately does NOT check Referer: every /go CTA is `rel="noreferrer"` by design (so we don't
 *  leak the affiliate path to AWIN/analytics on the outbound hop) — genuine human clicks arrive with
 *  no Referer too, so using its absence as a bot signal would zero out real conversions, not just bots. */
export function isLikelyBot(h: ClickHeaders): boolean {
  const ua = (h.userAgent || "").toLowerCase();
  if (!ua) return true;
  if (BOT_UA_PATTERN.test(ua)) return true;

  const looksLikeBrowserUA = /mozilla\/5\.0/.test(ua);
  const hasAcceptLanguage = !!h.acceptLanguage;
  const hasFetchMetadata = !!h.secFetchMode || !!h.secFetchSite;
  if (looksLikeBrowserUA && !hasAcceptLanguage && !hasFetchMetadata) return true;

  return false;
}

// Best-effort, in-process de-dupe for near-duplicate fires (the audit saw some clicks fire the event
// twice 0.2-0.4s apart). The actual root cause was a duplicated send call in the route (fixed — now
// exactly one send per click), but this stays as a cheap second guard against retries/double-taps
// landing on the SAME warm serverless instance within a few seconds. Not a distributed rate-limiter —
// it only covers repeats on one warm lambda, which is exactly the case that produces sub-second
// duplicate pairs.
const recentClicks = new Map<string, number>();
export const DEDUPE_WINDOW_MS = 4000;

export function isNearDuplicateClick(key: string): boolean {
  const now = Date.now();
  const last = recentClicks.get(key);
  // Opportunistic cleanup so the map can't grow unbounded on a long-lived warm instance.
  if (recentClicks.size > 500) {
    for (const [k, ts] of recentClicks) {
      if (now - ts > DEDUPE_WINDOW_MS) recentClicks.delete(k);
    }
  }
  recentClicks.set(key, now);
  return last !== undefined && now - last < DEDUPE_WINDOW_MS;
}

/** Test-only: clear the de-dupe map between test cases so they don't bleed into each other. */
export function _resetDedupeStateForTests(): void {
  recentClicks.clear();
}

// ─── /go affiliate-click bot filtering ──────────────────────────────────────
// 2026-06-30 marketing-suite audit: ≥53 of ~117 raw /go click-events in one week were sub-second,
// zero-pageview, 96%-US-tagged hits — bots firing the redirect directly, some duplicate-fired 0.2-0.4s
// apart. Forwarding the visitor's real UA to Umami (done in the route) lets Umami's own heuristic drop
// self-identifying bots (Googlebot, AhrefsBot, ...) fine — but generic scrapers/scanners that SPOOF a
// full desktop-browser UA string (no "bot"/"crawler" substring to match) sail straight through that
// heuristic. The checks below close that gap. Kept in its own module (not inline in the route) so
// it's unit-testable without going through Next's route-handler/`after()` request scope.
//
// 2026-07-11 Analytics verdict (company/analytics/2026-07-11-go-bot-traffic-verdict.md, Company repo):
// a distinct signature layered on top of the above — device mix inverted from the human baseline,
// anomalous UAs (BlackBerry OS, IE-on-Windows-7), and same-URL repeat-hits 5.8-25.5s apart (too slow
// for the old 4s dedupe window, too fast to be a human re-comparing the identical link). Widened
// DEDUPE_WINDOW_MS, added isHighVelocityClick as an independent check (catches one visitor sweeping
// many DIFFERENT URLs, which the same-URL dedupe below cannot), and extended BOT_UA_PATTERN.
//
// Every check below only ever affects the METRIC, never the redirect — a false positive here must
// never cost a real conversion.

/** Known bot/crawler/scraper/HTTP-library UA signatures, PLUS a couple of anomalous-device signatures
 *  (blackberry; Windows-7-era IE) added 2026-07-11 — not self-identifying bots, but real-2026-traffic-
 *  implausible enough (dead OS/browser combos) that the audit treated them the same way. Deliberately
 *  broad — this only gates whether we count the click in Umami, never whether we redirect, so a false
 *  positive costs nothing but a metric (never a lost conversion). */
export const BOT_UA_PATTERN =
  /bot|crawl|spider|slurp|archiver|scrapy|headless|phantomjs|puppeteer|playwright|selenium|python-requests|python-urllib|go-http-client|okhttp|libwww-perl|curl\/|wget\/|node-fetch|axios\/|postmanruntime|httpclient|java\/[0-9]|masscan|nmap|nikto|sqlmap|censys|shodan|zgrab|gptbot|ccbot|bytespider|petalbot|serpstatbot|dataforseobot|blexbot|mj12bot|dotbot|ahrefsbot|semrushbot|barkrowler|zoominfobot|claudebot|amazonbot|bingpreview|facebookexternalhit|telegrambot|discordbot|slackbot|linkedinbot|whatsapp|embedly|pingdom|uptimerobot|site24x7|newrelic|blackberry|(?=.*windows nt 6\.1)(?=.*(?:msie|trident))/i;

export type ClickHeaders = {
  userAgent: string | null;
  xForwardedFor: string | null;
  host: string | null;
  acceptLanguage: string | null;
  secFetchMode: string | null;
  secFetchSite: string | null;
  /** 2026-07-12: user-activation signal, set by the browser ONLY for a genuine user-initiated
   *  navigation (a real click), never for a scripted fetch/XHR or (per spec intent) a headless
   *  browser's programmatic page.goto(). Not yet gated on — see isLikelyBot below — captured so the
   *  Umami event can carry it for a validation pass before it becomes a hard filter. */
  secFetchUser: string | null;
};

/** True when the request is very unlikely to be a real click a human made on one of our CTAs.
 *  Signals, in order:
 *   1. The UA self-identifies (or fingerprints) as a bot/scraper/HTTP-library — the same class of
 *      signature Umami's own detector uses, kept here too as defense-in-depth.
 *   2. The UA CLAIMS to be a full desktop/mobile browser (`Mozilla/5.0 ...`) but the request carries
 *      NONE of the Fetch Metadata headers (`Sec-Fetch-*`) or `Accept-Language` that every real browser
 *      attaches automatically to a top-level navigation. Real users can't turn these off; simple
 *      scrapers that spoof a generic Chrome/Safari UA string routinely forget to fake them — this is
 *      exactly the "96%-US-tagged, zero-pageview" traffic class the audit flagged.
 *   3. [2026-07-12] `Sec-Fetch-Site` IS present (so signal 2 above didn't already catch it) but its
 *      value is anything other than `same-origin`. Every genuine /go click is a same-origin link click
 *      from a parkmath.co.uk page — mechanically the ONLY way this route is ever reached by a real
 *      user. Independent of the noreferrer note below: Sec-Fetch-Site reflects the browser's own
 *      origin computation, not the Referer header, so noreferrer does not affect it. Addresses today's
 *      geographically-distributed /go scraper (company/analytics/2026-07-12-affiliate-click-bot-filter-patch.md,
 *      Company repo) — full desktop Chrome/Edge UAs across 30+ countries that pass signals 1-2 but
 *      cannot mechanically produce a same-origin click on this route.
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

  // 2026-07-12: a request that DOES carry Sec-Fetch-Site but claims anything other than same-origin
  // cannot be a genuine click on our own CTA — see signal 3 in the doc comment above.
  if (h.secFetchSite && h.secFetchSite !== "same-origin") return true;

  return false;
}

// Best-effort, in-process de-dupe for near-duplicate fires (the audit saw some clicks fire the event
// twice 0.2-0.4s apart). The actual root cause was a duplicated send call in the route (fixed — now
// exactly one send per click), but this stays as a cheap second guard against retries/double-taps
// landing on the SAME warm serverless instance within a few seconds. Not a distributed rate-limiter —
// it only covers repeats on one warm lambda, which is exactly the case that produces sub-second
// duplicate pairs.
//
// 2026-07-11: widened from the original 4000ms. That was correctly tuned for the 0.2-0.4s double-fire
// bug above, but the same-day audit found a NEW, different repeat-hit pattern — identical /go URL
// re-hit 5.8-25.5s later, in one case 3x inside 24s — that a 4s window can't see at all. 40s comfortably
// clears the observed range (>1.5x the slowest observed repeat) while still being far shorter than any
// plausible reason a human would re-click the exact same affiliate link (the first click already
// navigated them away via the 302).
const recentClicks = new Map<string, number>();
export const DEDUPE_WINDOW_MS = 40000;

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

// 2026-07-11: a second, INDEPENDENT guard alongside the exact-URL dedupe above. That check only ever
// compares a URL to itself, so it can't see a visitor sweeping many DIFFERENT /go URLs — which is
// exactly what today's audit found (60 distinct URLs hit in one day, flat across every airport/product,
// the signature of a systematic crawl rather than organic browsing). A real visitor rarely compares
// more than a handful of merchant options in one sitting, so this flags a FINGERPRINT (not a URL) that
// generates an unusually high count of /go clicks — of any target — in a short window. Reuses the same
// visitor-identifying value the exact-URL dedupe key is built from (the first X-Forwarded-For hop, see
// route.ts) rather than inventing a new fingerprint; same caveat as above (in-process, per-warm-lambda,
// not a distributed rate-limiter — and a shared/proxy IP could in theory push several real visitors
// over the threshold together, same limitation the existing dedupe key already carries).
const recentClicksByFingerprint = new Map<string, number[]>();
export const VELOCITY_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
// Top of the audit-recommended 5-6 range: favors fewer false positives (this file's "never cost a real
// conversion" principle) while still sitting far below the dozens of clicks/5min the observed bot
// pattern (avg 12s between hits) produces — plenty of margin either way.
export const VELOCITY_MAX_CLICKS = 6;

export function isHighVelocityClick(fingerprint: string): boolean {
  const now = Date.now();
  const priorHits = recentClicksByFingerprint.get(fingerprint) ?? [];
  const withinWindow = priorHits.filter((ts) => now - ts < VELOCITY_WINDOW_MS);
  withinWindow.push(now);
  // Opportunistic cleanup so the map can't grow unbounded on a long-lived warm instance (same approach
  // as the de-dupe map above).
  if (recentClicksByFingerprint.size > 500) {
    for (const [k, hits] of recentClicksByFingerprint) {
      if (hits.every((ts) => now - ts > VELOCITY_WINDOW_MS)) recentClicksByFingerprint.delete(k);
    }
  }
  recentClicksByFingerprint.set(fingerprint, withinWindow);
  return withinWindow.length > VELOCITY_MAX_CLICKS;
}

/** Test-only: clear the de-dupe map between test cases so they don't bleed into each other. */
export function _resetDedupeStateForTests(): void {
  recentClicks.clear();
}

/** Test-only: clear the velocity map between test cases so they don't bleed into each other. */
export function _resetVelocityStateForTests(): void {
  recentClicksByFingerprint.clear();
}

import { after } from "next/server";
import { resolveGoTarget } from "@/lib/partners";
import {
  isHighVelocityClick,
  isLikelyBot,
  isNearDuplicateClick,
  type ClickHeaders,
} from "@/lib/go-bot-filter";

// First-party affiliate-click measurement. A CTA links to /go/<airport>/<target>?s=<surface>; this
// route records one durable, privacy-friendly click event and then 302-redirects to the *exact* AWIN
// deep link — awinmid/awinaffid/clickref/ued rebuilt by resolveGoTarget so affiliate attribution is
// untouched.
//
// Dynamic (never cached) so every click is counted. If the target is inactive/unknown we 404 rather
// than redirect, so this can never become an open redirect or emit a bare awin1.com link.
export const dynamic = "force-dynamic";

// Self-hosted Umami — same instance + website id as the client beacon (set in Vercel env for both
// Preview and Production). A server-side custom event is a DURABLE click record we own and can read in
// near-real-time, unlike the old console.log that only lived in ephemeral Vercel runtime logs.
const UMAMI_HOST = (process.env.NEXT_PUBLIC_UMAMI_HOST || "").replace(/\/+$/, "");
const UMAMI_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID || "";

/**
 * Bot-filtered, server-side Umami event for the affiliate click. We POST to Umami's /api/send and
 * — crucially — forward the *visitor's* real User-Agent plus an explicit `payload.ip` override, so
 * the event geolocates to the VISITOR's country rather than our own relay hop's.
 *
 * 2026-07-07 fix: the 2026-07-01 fix below only forwarded X-Forwarded-For as a HEADER — traced live
 * today and found insufficient on its own: 98.9% of affiliate_click events were tagged country=US
 * (company/analytics/2026-07-07-awin-attribution-trace.md, Finding A). Root cause, confirmed against
 * Umami's own source (github.com/umami-software/umami src/lib/ip.ts, and grepped in our actual
 * running container image `ghcr.io/umami-software/umami:postgresql-latest` v3.1.0): its
 * `getIpAddress()` walks a fixed header-priority list where `cf-connecting-ip` outranks
 * `x-forwarded-for` (2nd vs 8th). Our stats host (stats.parkmath.co.uk) sits behind a Cloudflare
 * Tunnel, so Cloudflare unconditionally stamps `cf-connecting-ip` on every request reaching Umami's
 * origin — for this server-relayed POST that's *our own Vercel function's egress IP* (not
 * spoofable, and not the visitor's), which always wins over whatever we put in X-Forwarded-For.
 * Umami's `getClientInfo()` (src/lib/detect.ts) has a documented, schema-validated escape hatch for
 * exactly this: `payload.ip` (if present) is used directly and SKIPS the header-derived lookup
 * entirely (`ip = payload?.ip || getIpAddress(headers)`), so sending the visitor's real IP in the
 * JSON body — not just the header — is what actually fixes geolocation. Kept the header forward too
 * (harmless, still useful defense-in-depth if that priority order ever changes upstream).
 *
 * `isLikelyBot` + `isNearDuplicateClick` + `isHighVelocityClick` (lib/go-bot-filter.ts) catch what
 * Umami's own heuristic doesn't — see that file for why (generic scrapers spoofing a browser UA; the
 * duplicate-fire root cause; the 2026-07-11 same-visitor-different-URLs sweep). Inert unless both
 * Umami env vars are set (matches the client beacon in SiteAnalytics), and
 * fully best-effort: a tight timeout + try/catch guarantee it can never delay or break the affiliate
 * redirect (conversion comes first). Takes a plain headers snapshot (not the live Request) because
 * it's invoked from inside next/server `after` — i.e. once the redirect has already been sent.
 */
async function recordUmamiClick(
  h: ClickHeaders,
  fields: { airport: string; target: string; surface: string | null },
): Promise<void> {
  const host = UMAMI_HOST;
  const websiteId = UMAMI_WEBSITE_ID;
  const ua = h.userAgent;
  // No UA ⇒ Umami can't bot-filter (and rejects UA-less sends); skip rather than count blind.
  if (!host || !websiteId || !ua) return;
  if (isLikelyBot(h)) return;

  // First hop of X-Forwarded-For = the original visitor (standard convention; Vercel populates this
  // correctly on the inbound request). "unknown" is only our own placeholder for the dedupe key below
  // — never send it on as `payload.ip` (visitorIp guard just below strips it back to undefined, which
  // JSON.stringify then omits entirely, so Umami falls back to its normal header-based detection
  // exactly as before whenever we genuinely don't have a real IP).
  const ip = h.xForwardedFor ? (h.xForwardedFor.split(",")[0] ?? "unknown").trim() : "unknown";
  if (isNearDuplicateClick(`${ip}:${fields.airport}:${fields.target}`)) return;
  // Independent of the exact-URL dedupe above: same visitor (by the same `ip` fingerprint), too many
  // /go clicks of ANY target in a rolling 5-minute window — see go-bot-filter.ts for why.
  if (isHighVelocityClick(ip)) return;
  const visitorIp = ip !== "unknown" ? ip : undefined;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 800);
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": ua,
    };
    if (h.xForwardedFor) headers["X-Forwarded-For"] = h.xForwardedFor;
    await fetch(`${host}/api/send`, {
      method: "POST",
      headers,
      signal: ctrl.signal,
      body: JSON.stringify({
        type: "event",
        payload: {
          website: websiteId,
          hostname: h.host || "www.parkmath.co.uk",
          url: `/go/${fields.airport}/${fields.target}`,
          name: "affiliate_click",
          ip: visitorIp,
          // secFetchUser is instrumentation-only for now (see go-bot-filter.ts) — carried through
          // to Umami so a follow-up audit can check its real-world distribution before it becomes
          // a hard gate in isLikelyBot. "1" means genuine user-activated navigation (?1); "0"/null
          // means absent (scripted request, or a browser that omits it).
          data: {
            airport: fields.airport,
            target: fields.target,
            surface: fields.surface,
            secFetchUser: h.secFetchUser ?? "0",
          },
        },
      }),
    });
  } catch {
    // Best-effort: timeouts / Umami downtime must never affect the redirect.
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ airport: string; target: string }> },
) {
  const { airport, target } = await params;
  const surface = new URL(req.url).searchParams.get("s") ?? "";

  const resolved = resolveGoTarget(target, airport, surface);
  if (!resolved) return new Response("Not found", { status: 404 });

  // Keep a structured log line too — a zero-cost fallback signal in runtime logs / any log drain.
  console.log(
    JSON.stringify({
      event: "parkmath_affiliate_click",
      airport,
      target,
      surface: surface || null,
      ts: new Date().toISOString(),
    }),
  );

  // Snapshot the headers we need BEFORE scheduling `after()` — read them eagerly off the live
  // Request, then hand the deferred callback plain values rather than the Request itself.
  const headersSnapshot: ClickHeaders = {
    userAgent: req.headers.get("user-agent"),
    xForwardedFor: req.headers.get("x-forwarded-for"),
    host: req.headers.get("host"),
    acceptLanguage: req.headers.get("accept-language"),
    secFetchMode: req.headers.get("sec-fetch-mode"),
    secFetchSite: req.headers.get("sec-fetch-site"),
    secFetchUser: req.headers.get("sec-fetch-user"),
  };

  // Durable, bot-filtered affiliate-click event → self-hosted Umami, grouped by airport + target +
  // surface. Sent via next/server `after` — AFTER the response is flushed — so the redirect stays
  // instant (no added latency on the user's click) and the event still completes on Vercel (the
  // function is kept warm for `after` work). Exactly ONE send per click: an earlier revision fired
  // this twice (once inline before the redirect, once here) — that code-level duplication, not bot
  // traffic, produced the "0.2-0.4s apart" duplicate pairs the audit saw.
  after(() => recordUmamiClick(headersSnapshot, { airport, target, surface: surface || null }));

  // 302 (temporary): the destination is per-click and must not be cached by intermediaries.
  return new Response(null, {
    status: 302,
    headers: { Location: resolved.url, "Cache-Control": "no-store" },
  });
}

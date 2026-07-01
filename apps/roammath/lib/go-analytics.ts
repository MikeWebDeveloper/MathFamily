import type { ClickHeaders } from "./go-bot-filter";
import { isLikelyBot, isNearDuplicateClick } from "./go-bot-filter";

/**
 * Server-side affiliate-click event for the /go route — the ONE function the route calls to record a
 * click. Kept behind this interface deliberately, so whatever analytics backend Mike eventually wires
 * for RoamMath only ever requires editing this file, never the route.
 *
 * Grepped the codebase first (per the task brief): NEXT_PUBLIC_UMAMI_HOST/WEBSITE_ID are NOT set for
 * RoamMath. Umami IS already the company's chosen self-hosted analytics backend though — the shared
 * `SiteAnalytics` component (packages/ui/src/site-analytics.tsx, already rendered in RoamMath's
 * app/layout.tsx) renders its client beacon the moment those two env vars exist, exactly like it does
 * for ParkMath today. So rather than inventing a second analytics system, this reuses ParkMath's exact
 * server-side Umami call (same env vars, same /api/send shape) — which makes this a GENUINE no-op
 * right now (the `if (!host || !websiteId || !ua) return;` guard below fires immediately, before any
 * network call, because the vars are unset) and a zero-code-change activation once they're set.
 *
 * To wire it: create a "roammath" website in the self-hosted Umami instance, then set
 * NEXT_PUBLIC_UMAMI_HOST + NEXT_PUBLIC_UMAMI_WEBSITE_ID in this app's Vercel project (Preview + Prod).
 * If Mike instead picks a different backend for RoamMath, replace the body of this function — nothing
 * else in the /go route needs to change.
 *
 * Until wired, the structured console.log the route already writes on every hit (bot or not) is the
 * durable signal — visible in Vercel runtime logs / any log drain — so click volume isn't silently
 * lost while this stays inert.
 */
const UMAMI_HOST = (process.env.NEXT_PUBLIC_UMAMI_HOST || "").replace(/\/+$/, "");
const UMAMI_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID || "";

export interface AffiliateClickFields {
  country: string;
  target: string;
  surface: string | null;
  isAffiliate: boolean;
}

export async function recordAffiliateClick(h: ClickHeaders, fields: AffiliateClickFields): Promise<void> {
  const host = UMAMI_HOST;
  const websiteId = UMAMI_WEBSITE_ID;
  const ua = h.userAgent;
  // No backend configured for this app yet, or no UA to bot-filter on — no-op (true today for RoamMath).
  if (!host || !websiteId || !ua) return;
  if (isLikelyBot(h)) return;

  const ip = h.xForwardedFor ? (h.xForwardedFor.split(",")[0] ?? "unknown").trim() : "unknown";
  if (isNearDuplicateClick(`${ip}:${fields.country}:${fields.target}`)) return;

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
          hostname: h.host || "www.roammath.co.uk",
          url: `/go/${fields.country}/${fields.target}`,
          name: "affiliate_click",
          data: {
            country: fields.country,
            target: fields.target,
            surface: fields.surface,
            affiliate: fields.isAffiliate,
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

import { after } from "next/server";
import { resolveGoTarget } from "@/lib/partners";
import type { ClickHeaders } from "@/lib/go-bot-filter";
import { recordAffiliateClick } from "@/lib/go-analytics";

// First-party affiliate-click measurement, ported from ParkMath's app/go/[airport]/[target]/route.ts.
// A CTA links to /go/<country>/<target>?s=<surface>; this route records one click event and then
// 302-redirects to the exact partner destination — resolveGoTarget rebuilds it so any AWIN
// awinmid/awinaffid/clickref/ued (or eSIM deep link) is byte-identical to what the component would
// have linked to directly.
//
// Dynamic (never cached) so every click is counted. Unlike ParkMath's per-airport route (which 404s
// when no merchant serves that airport at all — there is genuinely nothing to link to), RoamMath's
// categories are generic across every country: resolveGoTarget only returns null for a malformed/
// unknown target, and otherwise falls back to a real, non-tracked official destination when no
// partner is active yet — so this can never become an open redirect, never emits a bare/broken link,
// and never leaves a visitor at a dead end.
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ country: string; target: string }> },
) {
  const { country, target } = await params;
  const surface = new URL(req.url).searchParams.get("s") ?? "";

  const resolved = resolveGoTarget(target, country);
  if (!resolved) return new Response("Not found", { status: 404 });

  // Structured log line — a zero-cost fallback signal in runtime logs / any log drain, independent of
  // whether the Umami backend below is wired yet.
  console.log(
    JSON.stringify({
      event: "roammath_affiliate_click",
      country,
      target,
      surface: surface || null,
      affiliate: resolved.isAffiliate,
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
  };

  // Bot-filtered click event, sent via next/server `after` — AFTER the response is flushed, so the
  // redirect stays instant. recordAffiliateClick is currently a no-op (see lib/go-analytics.ts):
  // RoamMath has no analytics backend wired yet, so this only proves the interface is ready — it does
  // not fabricate a metric that doesn't exist.
  after(() =>
    recordAffiliateClick(headersSnapshot, {
      country,
      target,
      surface: surface || null,
      isAffiliate: resolved.isAffiliate,
    }),
  );

  // 302 (temporary): the destination is per-click and must not be cached by intermediaries.
  return new Response(null, {
    status: 302,
    headers: { Location: resolved.url, "Cache-Control": "no-store" },
  });
}

import { resolveGoTarget } from "@/lib/partners";

// First-party affiliate-click measurement. A CTA links to /go/<airport>/<target>?s=<surface>; this
// route records one lightweight, privacy-friendly click event (a single structured log line, no
// cookies, no PII, no third-party script) and then 302-redirects to the *exact* AWIN deep link —
// awinmid/awinaffid/clickref/ued rebuilt by resolveGoTarget so affiliate attribution is untouched.
//
// Dynamic (never cached) so every click is counted. If the target is inactive/unknown we 404 rather
// than redirect, so this can never become an open redirect or emit a bare awin1.com link.
export const dynamic = "force-dynamic";

/**
 * Bot-filtered, server-side Umami event for the affiliate click. We POST to Umami's /api/send and
 * — crucially — forward the *visitor's* real User-Agent (and X-Forwarded-For for coarse geo). Umami
 * runs that UA through its bot detector: real browsers are counted, bots/scrapers/most QA tooling are
 * dropped. Without forwarding the UA the request would carry the serverless runtime's UA (or none),
 * so Umami can't bot-filter and every hit — bots included — gets counted. Inert unless both Umami env
 * vars are set (matches the client beacon in SiteAnalytics), and fully best-effort: a tight timeout +
 * try/catch guarantee it can never delay or break the affiliate redirect (conversion comes first).
 */
async function recordUmamiClick(
  req: Request,
  fields: { airport: string; target: string; surface: string | null },
): Promise<void> {
  const host = (process.env.NEXT_PUBLIC_UMAMI_HOST || "").replace(/\/+$/, "");
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const ua = req.headers.get("user-agent");
  // No UA ⇒ Umami can't bot-filter (and rejects UA-less sends); skip rather than count blind.
  if (!host || !websiteId || !ua) return;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 800);
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": ua,
    };
    const xff = req.headers.get("x-forwarded-for");
    if (xff) headers["X-Forwarded-For"] = xff;
    await fetch(`${host}/api/send`, {
      method: "POST",
      headers,
      signal: ctrl.signal,
      body: JSON.stringify({
        type: "event",
        payload: {
          website: websiteId,
          hostname: req.headers.get("host") || "www.parkmath.co.uk",
          url: `/go/${fields.airport}/${fields.target}`,
          name: "affiliate_click",
          data: { airport: fields.airport, target: fields.target, surface: fields.surface },
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

  // The money metric: one structured line per affiliate-CTA click, grouped by airport + target +
  // surface. Readable from Vercel runtime logs (filter on the "parkmath_affiliate_click" marker) or
  // any log drain — counts = clicks. Deliberately no IP/UA/cookie: privacy-friendly by construction.
  console.log(
    JSON.stringify({
      event: "parkmath_affiliate_click",
      airport,
      target,
      surface: surface || null,
      ts: new Date().toISOString(),
    }),
  );

  // Second, bot-filtered counter in Umami (forwards the visitor UA so bots/QA are excluded). Awaited
  // with an 800 ms cap so the event survives serverless suspension without meaningfully delaying users.
  await recordUmamiClick(req, { airport, target, surface: surface || null });

  // 302 (temporary): the destination is per-click and must not be cached by intermediaries.
  return new Response(null, {
    status: 302,
    headers: { Location: resolved.url, "Cache-Control": "no-store" },
  });
}

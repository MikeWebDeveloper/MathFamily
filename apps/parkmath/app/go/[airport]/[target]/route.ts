import { after } from "next/server";
import { resolveGoTarget } from "@/lib/partners";

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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ airport: string; target: string }> },
) {
  const { airport, target } = await params;
  const surface = new URL(req.url).searchParams.get("s") ?? "";

  const resolved = resolveGoTarget(target, airport, surface);
  if (!resolved) return new Response("Not found", { status: 404 });

  // Durable affiliate-click event → self-hosted Umami, grouped by airport + target + surface. Sent
  // AFTER the response is flushed (next/server `after`), so the redirect stays instant and the event
  // still completes on Vercel (the function is kept warm for `after` work) — no fire-and-forget race.
  // Privacy-friendly: forwards only the UA + the click dimensions; no cookies, no PII set by us.
  if (UMAMI_HOST && UMAMI_WEBSITE_ID) {
    const userAgent = req.headers.get("user-agent") || "parkmath-go/1.0";
    const hostname = req.headers.get("host") || "parkmath.co.uk";
    const data: Record<string, string> = { airport, target };
    if (surface) data.surface = surface;
    after(async () => {
      try {
        await fetch(`${UMAMI_HOST}/api/send`, {
          method: "POST",
          headers: { "content-type": "application/json", "user-agent": userAgent },
          body: JSON.stringify({
            type: "event",
            payload: {
              website: UMAMI_WEBSITE_ID,
              hostname,
              url: `/go/${airport}/${target}`,
              name: "affiliate_click",
              data,
            },
          }),
        });
      } catch {
        // Never let measurement failure touch the user — the redirect has already happened.
      }
    });
  }

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

  // 302 (temporary): the destination is per-click and must not be cached by intermediaries.
  return new Response(null, {
    status: 302,
    headers: { Location: resolved.url, "Cache-Control": "no-store" },
  });
}

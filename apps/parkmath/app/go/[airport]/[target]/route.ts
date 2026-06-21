import { resolveGoTarget } from "@/lib/partners";

// First-party affiliate-click measurement. A CTA links to /go/<airport>/<target>?s=<surface>; this
// route records one lightweight, privacy-friendly click event (a single structured log line, no
// cookies, no PII, no third-party script) and then 302-redirects to the *exact* AWIN deep link —
// awinmid/awinaffid/clickref/ued rebuilt by resolveGoTarget so affiliate attribution is untouched.
//
// Dynamic (never cached) so every click is counted. If the target is inactive/unknown we 404 rather
// than redirect, so this can never become an open redirect or emit a bare awin1.com link.
export const dynamic = "force-dynamic";

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

  // 302 (temporary): the destination is per-click and must not be cached by intermediaries.
  return new Response(null, {
    status: 302,
    headers: { Location: resolved.url, "Cache-Control": "no-store" },
  });
}

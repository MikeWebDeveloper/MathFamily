import { resolveGoTarget } from "@/lib/partners";

// First-party affiliate-click measurement, ported from ParkMath. A CTA links to
// /go/<key>/<target>?s=<surface>; this route logs one structured line (no cookies,
// no PII) then 302s to the EXACT AWIN deep link. Fail-closed: unknown/inactive
// target ⇒ 404 (never an open redirect, never a bare awin1.com link).
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ key: string; target: string }> }) {
  const { key, target } = await params;
  const surface = new URL(req.url).searchParams.get("s") ?? "";
  const resolved = resolveGoTarget(target, key);
  if (!resolved) return new Response("Not found", { status: 404 });
  console.log(JSON.stringify({ event: "loungemath_affiliate_click", key, target, surface: surface || null, ts: new Date().toISOString() }));
  return new Response(null, { status: 302, headers: { Location: resolved.url, "Cache-Control": "no-store" } });
}

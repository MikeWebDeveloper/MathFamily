import { processSubscription, readFamilyEnv } from "@mathfamily/engine";

export const runtime = "nodejs"; // outbound HTTPS (Resend / MailerLite) + server-only env
export const dynamic = "force-dynamic"; // never cache a mutation endpoint

const BRAND = "RoamMath";
const MAX_BODY = 4_000;

/** Email-list signup funnel — durable, consented, cross-brand. Accepts JSON (the enhanced fetch
 *  path) and application/x-www-form-urlencoded (the no-JS <form> fallback). Durable-first: a valid,
 *  consented signup is persisted (log + Resend) before MailerLite is ever attempted, so nothing is
 *  lost in the pre-token window. The shared logic lives in @mathfamily/engine; this route is the
 *  thin per-app adapter — identical for every brand except BRAND. */
export async function POST(req: Request) {
  const env = readFamilyEnv();
  const contentType = req.headers.get("content-type") ?? "";
  const isForm =
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data");

  let email = "";
  let source = "unknown";
  let consent: unknown = false;

  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY) return reply(isForm, req, { ok: false, reason: "invalid_email" }, 413);
    if (isForm) {
      const p = new URLSearchParams(raw);
      email = p.get("email") ?? "";
      consent = p.get("consent");
      source = p.get("source") ?? "unknown";
    } else {
      const b = raw ? JSON.parse(raw) : {};
      email = typeof b.email === "string" ? b.email : "";
      consent = b.consent;
      source = typeof b.source === "string" ? b.source : "unknown";
    }
  } catch {
    return reply(isForm, req, { ok: false, reason: "invalid_email" }, 400);
  }

  // Pass the originating page (referer) so the operator notification can show WHERE it came from.
  const referrer = req.headers.get("referer") ?? undefined;
  const result = await processSubscription({ email, consent, brand: BRAND, source, referrer }, env);
  if (!result.ok) {
    const status = result.reason === "durable_failed" ? 500 : 400; // only durable_failed is retryable
    return reply(isForm, req, result, status);
  }
  return reply(isForm, req, result, 200);
}

// No-JS form posts get a redirect back to the originating page; JSON callers get JSON.
function reply(isForm: boolean, req: Request, body: Record<string, unknown>, status: number): Response {
  if (isForm) {
    const back = safeBackUrl(req.headers.get("referer"), req.url);
    back.searchParams.set("subscribed", body.ok ? "1" : "0");
    return Response.redirect(back.toString(), 303);
  }
  return Response.json(body, { status });
}

// Open-redirect guard: only ever redirect back to our own origin.
function safeBackUrl(referer: string | null, reqUrl: string): URL {
  const origin = new URL(reqUrl).origin;
  try {
    if (referer) {
      const u = new URL(referer);
      if (u.origin === origin) return u;
    }
  } catch {
    /* fall through */
  }
  return new URL("/", origin);
}

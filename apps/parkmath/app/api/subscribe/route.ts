import { processSubscription, readEnv } from "@/lib/subscribe";

// Node runtime: we make outbound HTTPS calls (Resend / MailerLite) and read server-only env.
export const runtime = "nodejs";
// Never cache or statically optimise a mutation endpoint.
export const dynamic = "force-dynamic";

const MAX_BODY = 4_000; // a generous ceiling for {email, consent, source} — rejects abuse.

/** Email-list signup funnel. Accepts JSON (the enhanced fetch path) and
 *  application/x-www-form-urlencoded (the no-JS <form> fallback). Durable-first: a valid,
 *  consented signup is persisted before MailerLite is ever attempted, so nothing is lost in the
 *  pre-token window. See lib/subscribe.ts for the guarantee. */
export async function POST(req: Request) {
  const env = readEnv();
  const contentType = req.headers.get("content-type") ?? "";
  const isForm = contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data");

  let email = "";
  let consent: unknown = false;
  let source = "unknown";

  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY) return reply(isForm, req, { ok: false, reason: "invalid_email" }, 413);

    if (isForm) {
      const params = new URLSearchParams(raw);
      email = params.get("email") ?? "";
      consent = params.get("consent");
      source = params.get("source") ?? "unknown";
    } else {
      const body = raw ? JSON.parse(raw) : {};
      email = typeof body.email === "string" ? body.email : "";
      consent = body.consent;
      source = typeof body.source === "string" ? body.source : "unknown";
    }
  } catch {
    return reply(isForm, req, { ok: false, reason: "invalid_email" }, 400);
  }

  const result = await processSubscription({ email, consent, source }, env);

  if (!result.ok) {
    // durable_failed is the only genuinely-retryable server error (500); the rest are bad input.
    const status = result.reason === "durable_failed" ? 500 : 400;
    return reply(isForm, req, result, status);
  }
  return reply(isForm, req, result, 200);
}

/** No-JS form posts get a redirect back to the originating page with a status flag so the page
 *  can show a confirmation; JSON callers get JSON. */
function reply(isForm: boolean, req: Request, body: Record<string, unknown>, status: number): Response {
  if (isForm) {
    const referer = req.headers.get("referer");
    const back = safeBackUrl(referer, req.url);
    back.searchParams.set("subscribed", body.ok ? "1" : "0");
    return Response.redirect(back.toString(), 303);
  }
  return Response.json(body, { status });
}

/** Only ever redirect back to our own origin (open-redirect guard). */
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

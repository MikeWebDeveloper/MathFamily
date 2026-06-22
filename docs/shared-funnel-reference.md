# Shared cross-brand funnel — Phase B reference

All three blockers are now solved in the shared kit. This doc is the **copy-paste reference**
each app's Director/Engineer follows in Phase B. No app-local re-implementation: the logic lives in
`@mathfamily/engine` and `@mathfamily/ui` / `@mathfamily/geo`; per-app files are thin adapters.

---

## 1. EmailCaptureSlot — the durable, consented, cross-brand funnel (the moat)

`@mathfamily/ui` → `EmailCaptureSlot`. **The funnel is the default.** Pass `brandName`; do NOT pass
`formAction` (legacy/deprecated). New prop signature:

```tsx
// FUNNEL (default — use this):
<EmailCaptureSlot
  brandName="EnergyMath"                              // REQUIRED — drives consent/success copy + sent to /api/subscribe for attribution
  hook="Get notified when the energy price cap moves" // REQUIRED — bold line above the input
  description="monthly UK energy price-cap update"     // optional — folded into the consent label + success copy
  source="home"                                        // optional — surface tag: "home" | "region" | "<spoke>"
  privacyHref="/privacy"                               // optional — defaults to /privacy
  action="/api/subscribe"                              // optional — defaults to /api/subscribe
/>

// LEGACY (DEPRECATED — only kept for old call sites; do NOT use in new code):
<EmailCaptureSlot hook="..." formAction={process.env.NEXT_PUBLIC_MAILERLITE_FORM_ACTION} />
```

It always renders, posts to the first-party `/api/subscribe` route, shows an **un-ticked, required
consent checkbox + privacy link**, derives all copy from `brandName`/`description` (no hardcoded
brand), and tags `brand` + `source` on the POST body.

### Reference `/api/subscribe` route — copy into `app/api/subscribe/route.ts`

The durable logic is shared in `@mathfamily/engine` (`processSubscription`, `readFamilyEnv`). The
per-app route is a thin adapter — identical for every brand except the `brand` literal:

```ts
// apps/<name>/app/api/subscribe/route.ts
import { processSubscription, readFamilyEnv } from "@mathfamily/engine";

export const runtime = "nodejs";        // outbound HTTPS (Resend / MailerLite) + server-only env
export const dynamic = "force-dynamic"; // never cache a mutation endpoint

const BRAND = "EnergyMath";  // <-- the ONLY per-app change
const MAX_BODY = 4_000;

export async function POST(req: Request) {
  const env = readFamilyEnv();
  const contentType = req.headers.get("content-type") ?? "";
  const isForm =
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data");

  let email = "", source = "unknown";
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

  const result = await processSubscription({ email, consent, brand: BRAND, source }, env);
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
  } catch { /* fall through */ }
  return new URL("/", origin);
}
```

> ParkMath keeps its existing `apps/parkmath/lib/subscribe.ts` + route (its own MailerLite group).
> New apps use the shared `@mathfamily/engine` path above, which posts to the **ONE shared family
> group** instead.

### Env vars (Vercel project settings — same in every app)

| Var | Purpose |
|---|---|
| `RESEND_API_TOKEN` | durable sink — email each signup to the Company inbox |
| `SIGNUP_NOTIFY_TO` | the inbox that receives the durable signup record |
| `SIGNUP_NOTIFY_FROM` | optional; defaults to `<brand> signups <list@themathfamily.com>` |
| `MAILERLITE_API_TOKEN` | MailerLite connector (best-effort) |
| `MAILERLITE_FAMILY_GROUP_ID` | the ONE shared "What Britain Pays This Month" family group id — **same value in every app** |

Until `MAILERLITE_*` is set the route still works: signups are captured durably (log + Resend) and
the family-list step reports `skipped`. Nothing is lost in the pre-token window.

---

## 2. Surface-tagged affiliate `/go` redirect — shared kit

`@mathfamily/engine` → `createGoRoute` + `logAffiliateClick`. Mount a catch-all go route:

```ts
// apps/<name>/app/go/[...go]/route.ts
import { createGoRoute } from "@mathfamily/engine";
import { resolveDeeplink } from "@/lib/partners"; // your app's deeplink resolver (parts + surface → url | null)

export const dynamic = "force-dynamic";

export const GET = createGoRoute({
  brand: "EnergyMath",
  resolveDeeplink, // (parts: string[], surface: string) => string | null
  // fallbackPath: "/",   // optional — where to land when there's no live deeplink (default "/")
});
```

A CTA links to `/go/<...slug>?s=<surface>`. The route logs ONE structured `affiliate_click` JSON line
(tagged `brand` + `target` + `surface`, no PII/cookies) and 302-redirects to the resolved deeplink.

**Inert-safe / fail-closed:** if `resolveDeeplink` returns `null` (no live deal yet) it STILL logs the
intent and 302s back to an on-site page on the same origin — never a 404, never a broken/bare
affiliate link, never an open redirect. So ship the `/go` surface before deals are wired and lose no
signal.

---

## 3. `organizationLd` parentOrganization — emit the family entity natively

`@mathfamily/geo` → `organizationLd` now takes an optional `parentOrganization`:

```ts
organizationLd({
  siteUrl: SITE_URL,
  name: "EnergyMath",
  logoUrl: `${SITE_URL}/opengraph-image`,
  founder: { name: "Michal Latal", jobTitle: "Founder & editor" },
  parentOrganization: { name: "The Math Family", url: "https://themathfamily.com" }, // <-- NEW
});
```

It emits a proper `parentOrganization` node with `@type`, a stable `@id`
(`https://themathfamily.com/#organization`), `name` AND `url`. **Phase B: delete the per-app
`lib/org-ld.ts` / inline-spread workarounds** (sidemath, petmath, movemath, rentmath, roammath,
dentalmath, etc.) and pass `parentOrganization` to the shared builder instead — so all 9 apps declare
the same parent consistently.
```

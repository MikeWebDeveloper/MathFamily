# ParkMath Email Capture — Design

**Date:** 2026-06-22
**Branch:** `feat/parkmath-p0-content-data-2026-06-22`
**Goal:** Capture email signups across the ParkMath hub + spoke pages before tomorrow's
data-PR traffic spike (Tue 08:30). MailerLite-ready but **fail-safe without the API token**:
never lose a single signup.

## Problem with the current state

`EmailCaptureSlot` (`packages/ui/src/email-capture-slot.tsx`) is used on the homepage and
every spoke page (8+ call sites), but it `return null` whenever `formAction` is falsy — and
`NEXT_PUBLIC_MAILERLITE_FORM_ACTION` is **unset in production**. So today **every signup
surface renders nothing and 100% of would-be signups are lost.** It also posts straight to
MailerLite's native form endpoint with **no GDPR consent** and no durable fallback.

## Architecture

A single own-domain API route is the funnel; the form always renders; the route persists
durably *before* it ever tries MailerLite.

```
[EmailCaptureSlot form]  --POST /api/subscribe-->  [route handler]
   always renders                                    1. validate email + consent
   GDPR consent + privacy link                       2. DURABLE SINK (always):
   progressive-enhancement <form>                        - Resend email to Company inbox
                                                          - structured console.log line
                                                     3. MailerLite subscribe (if token set)
                                                     4. success iff durable sink confirmed
```

### Why this store (decision)

Runs on **Vercel serverless** → no durable local filesystem. Options weighed:

- **Resend email-per-signup (CHOSEN)** — token already live (`resend-token-full`),
  `parkmath.co.uk` verified for sending. Each signup is emailed to a Company inbox; Gmail is
  the append-only authoritative store. Zero provisioning, works from first deploy, doubles as
  a real-time signup notification. Recovery = read the inbox.
- Cloudflare KV/D1 — durable, token available, but needs namespace + account-write secret in
  Vercel and the app isn't on CF Workers (no native binding). Heavier for a one-day deadline.
- Vercel Blob/KV — cleanest native fit but needs a storage product enabled + new token now.

**Belt-and-braces:** alongside the Resend email, the route also writes a structured
`SIGNUP|<email>|<source>|<iso8601>` line via `console.log`, captured in Vercel runtime logs —
a second independent durable copy. Success is returned **only** if at least the durable sink
confirmed. MailerLite is best-effort on top; its absence or failure never loses a signup.

## Components

### 1. `EmailCaptureSlot` (upgraded in place — `packages/ui`)
Keep the name + `hook` prop so all 8 call sites work unchanged. Changes:
- **Always renders** (drop the `formAction` null-gate).
- Client component posting to `/api/subscribe` via `fetch`; native `<form action="/api/subscribe"
  method="post">` fallback so it works with JS off (progressive enhancement, per repo rule).
- **GDPR:** unticked `consent` checkbox (required) with explicit wording + link to `/privacy`.
  No pre-ticked boxes.
- States: idle → submitting → success ("You're on the list") / error (with retry).
- On-brand: existing Tailwind tokens (`brand-accent`, `ink`, `surface`, focus rings, `mf-press`).
- Mobile-first: stacked on small screens, inline on ≥sm.
- `source` hidden field = page path, so we know which surface converted.

### 2. `/api/subscribe` route (`apps/parkmath/app/api/subscribe/route.ts`, Node runtime)
- Accepts JSON (`fetch`) and `application/x-www-form-urlencoded` (no-JS fallback; redirects
  back with `?subscribed=1`).
- Validates: well-formed email, `consent` truthy. 400 on missing consent/invalid email.
- Durable sink (always): `sendDurable(email, source)` → Resend email + structured log line.
- MailerLite (if `MAILERLITE_API_TOKEN`): POST to `/api/subscribers` with `groups:[GROUP_ID]`.
  Wrapped in try/catch; failure is logged, not surfaced as user error.
- Returns `{ ok: true }` once durable sink confirmed; `{ ok:false }` + 500 only if durable
  sink itself fails (so the client can ask the user to retry — still no silent loss).
- Basic hardening: method guard, max body size, light per-request validation. No PII beyond
  the email the user typed.

### 3. Flush / import tool (`tools/mailerlite/flush.mjs`, zero-dep Node)
One command to import a recovered list into MailerLite once the token lands:
`node tools/mailerlite/flush.mjs emails.txt` — reads token from
`~/.config/company/mailerlite-token`, group from arg/env, subscribes each email to the
ParkMath group, idempotent (MailerLite upserts), prints a per-email result + summary.
Source list = addresses recovered from the Company inbox / Vercel logs.

### 4. Config
- **Now (pre-token):** set `RESEND_API_TOKEN` + `SIGNUP_NOTIFY_TO` in Vercel production so the
  durable email sink is live from the first deploy.
- **When token lands:** drop it at `~/.config/company/mailerlite-token` (for the flush tool),
  and set `MAILERLITE_API_TOKEN` + `MAILERLITE_GROUP_ID` in Vercel → the route auto-subscribes
  live signups; run the flush tool once to backfill anything captured pre-token.
- CSP already allows `connect-src 'self'`, so the same-origin fetch is fine. No CSP edit.
- Privacy page already states list handling; add one line naming MailerLite + consent basis.

## Copy (value hook, no fabrication)
- Hub: "Drop-off fees change every January — get told when an airport's does."
- Spoke: "Get told when {airport} changes its drop-off fee." (keeps existing per-page `hook`.)
- Consent: "Email me ParkMath's monthly UK drop-off fee update. I can unsubscribe any time."
  + "See our [privacy policy](/privacy)."

## Testing
- **Vitest (jsdom):** `EmailCaptureSlot` always renders; consent checkbox present + unticked +
  required; privacy link present; submit disabled until consent (or server rejects without it).
- **Route unit:** rejects missing consent / bad email (400); with no MailerLite token still
  returns ok after durable sink; durable-sink failure → 500. (Resend/MailerLite calls mocked.)
- **Playwright:** mobile 390 + desktop 1366 — form renders, consent gate works, happy-path
  submit shows success. (Network mocked so no real email sent in CI.)
- **Build green** (`pnpm --filter parkmath build`) before any deploy.

## Out of scope
Double opt-in confirmation flow (MailerLite handles confirmation emails once connected),
admin dashboard, analytics events beyond the existing Umami pageview layer.

"use client";

import { useState, type FormEvent } from "react";

/** Email capture — the front door to the durable, consented, cross-brand family funnel (the moat).
 *
 *  THE DEFAULT PATH is the funnel: it ALWAYS renders, POSTs to a first-party `/api/subscribe`
 *  route, and persists durably BEFORE MailerLite is ever touched (see each app's lib/subscribe.ts,
 *  copied from ParkMath's template). Every brand's signups land in ONE shared MailerLite family
 *  group — the "What Britain Pays This Month" list — tagged `source` (app + surface) and `brand`
 *  so we can attribute which app/page converted.
 *
 *  - Progressive enhancement: a real <form action="/api/subscribe" method="post">, so it works
 *    with JS off (the route redirects back with ?subscribed=1). With JS we intercept, fetch, and
 *    show inline success/error without a navigation.
 *  - UK GDPR: an explicit, UN-ticked consent checkbox (required) + a link to the privacy policy.
 *    No pre-ticked boxes, no assumed consent.
 *  - Brand-neutral copy: consent + success text are derived from `brandName` (and the optional
 *    per-brand `description` hook), NOT hardcoded to any one brand.
 *
 *  `formAction` is the LEGACY, DEPRECATED native-MailerLite mode (no consent, no privacy link, no
 *  durable sink). It is preserved verbatim ONLY so existing call sites that still pass it keep
 *  working — when passed (even empty) the component takes the old branch and `brandName` is not
 *  required. New code must NOT use `formAction`; pass `brandName` and let the funnel run. */
type FunnelProps = {
  /** The bold hook line shown above the input. */
  hook: string;
  /** Required for the funnel: the calling brand, e.g. "RoamMath". Drives consent/success copy and
   *  is sent to /api/subscribe so the shared family list can attribute the brand. */
  brandName: string;
  /** Optional per-brand hook copy describing what they're signing up to receive, e.g.
   *  "monthly UK energy price-cap update". Folded into the consent label + success message. */
  description?: string;
  /** Surface tag, e.g. "home" / "region" / "<spoke>" — recorded for per-page attribution. */
  source?: string;
  /** Brand's own privacy policy route. Defaults to /privacy. */
  privacyHref?: string;
  /** First-party funnel endpoint. Defaults to /api/subscribe. */
  action?: string;
  formAction?: undefined;
};

type LegacyProps = {
  hook: string;
  /** @deprecated Legacy native-MailerLite mode — no consent checkbox, no privacy link, no durable
   *  sink. Kept only for back-compat with old call sites that pass the env-driven form action
   *  (`formAction={process.env.NEXT_PUBLIC_MAILERLITE_FORM_ACTION}`, i.e. `string | undefined`).
   *  The mere PRESENCE of this prop key selects legacy mode; `brandName` is then not required.
   *  Use the funnel (omit `formAction`, pass `brandName`) for all new code. */
  formAction: string | undefined;
  brandName?: string;
  description?: string;
  source?: string;
  privacyHref?: string;
  action?: string;
};

export type EmailCaptureSlotProps = FunnelProps | LegacyProps;

export function EmailCaptureSlot(props: EmailCaptureSlotProps) {
  const {
    hook,
    brandName,
    description,
    source,
    privacyHref = "/privacy",
    action = "/api/subscribe",
    formAction
  } = props;

  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  // LEGACY MODE (DEPRECATED): a call site explicitly passed `formAction`. Empty URL → render
  // nothing (the historical contract those apps rely on). This branch never uses fetch or the
  // GDPR/consent funnel — preserved verbatim so old call sites are untouched.
  if (formAction !== undefined) {
    if (!formAction) return null;
    return (
      <form action={formAction} method="post" className="rounded-card bg-surface p-6">
        <p className="font-semibold text-ink">{hook}</p>
        <div className="mt-3 flex gap-2">
          <label htmlFor="email-capture-input" className="sr-only">Email address</label>
          <input
            id="email-capture-input"
            type="email"
            name="fields[email]"
            required
            placeholder="you@example.com"
            className="w-full rounded-lg border border-ink/20 px-3 py-2 text-sm outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/30"
          />
          <button type="submit" className="mf-press inline-flex min-h-11 items-center rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50">
            Notify me
          </button>
        </div>
        <p className="mt-2 text-xs text-ink-muted">No spam. Unsubscribe any time.</p>
      </form>
    );
  }

  // FUNNEL MODE (default). `brandName` is required by the type here. Copy is derived, never hardcoded.
  const brand = brandName ?? "the family";
  // Consent line: "Email me <brand>'s <description>." Falls back to a neutral brand-derived line.
  const consentBody = description ? `Email me ${brand}'s ${description}.` : `Email me ${brand}'s monthly update.`;
  const successBody = description
    ? `We'll email you ${brand}'s ${description}. Unsubscribe any time.`
    : `We'll email you when ${brand} has something worth your while. Unsubscribe any time.`;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    // Progressive enhancement: if fetch isn't available, let the native POST proceed.
    if (typeof fetch !== "function") return;
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") ?? "");
    const consent = data.get("consent") === "on";
    if (!consent) {
      setStatus("error");
      return;
    }
    setStatus("submitting");
    try {
      const res = await fetch(action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          consent: true,
          brand: brandName,
          source: source ?? (typeof window !== "undefined" ? window.location.pathname : "unknown")
        })
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-card bg-surface p-6" role="status" aria-live="polite">
        <p className="flex items-center gap-2 font-semibold text-ink">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-positive)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          You&apos;re on the list.
        </p>
        <p className="mt-1 text-sm text-ink-muted">{successBody}</p>
      </div>
    );
  }

  return (
    <form action={action} method="post" onSubmit={onSubmit} className="rounded-card bg-surface p-6">
      <p className="font-semibold text-ink">{hook}</p>
      <input type="hidden" name="source" value={source ?? ""} />
      <input type="hidden" name="brand" value={brandName ?? ""} />

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="email-capture-input" className="sr-only">Email address</label>
        <input
          id="email-capture-input"
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="w-full rounded-lg border border-ink/20 px-3 py-2 text-sm outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/30"
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className="mf-press inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50 disabled:opacity-60"
        >
          {status === "submitting" ? "Adding…" : "Notify me"}
        </button>
      </div>

      <label className="mt-3 flex items-start gap-2 text-xs text-ink-muted">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-0.5 size-4 shrink-0 rounded border-ink/30 text-brand-accent focus:ring-2 focus:ring-brand-accent/30"
        />
        <span>
          {consentBody} I can unsubscribe any time. See our{" "}
          <a href={privacyHref} className="font-medium text-brand-accent underline underline-offset-2">privacy policy</a>.
        </span>
      </label>

      {status === "error" ? (
        <p className="mt-2 text-xs font-medium text-warning" role="alert">
          Please tick the consent box and enter a valid email, then try again.
        </p>
      ) : (
        <p className="mt-2 text-xs text-ink-muted">No spam. Unsubscribe any time.</p>
      )}
    </form>
  );
}

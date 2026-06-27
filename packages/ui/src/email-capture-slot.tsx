"use client";

import { useState, type FormEvent } from "react";

/** Email capture — the front door to the list. ALWAYS renders (the old version returned null
 *  without a MailerLite form-action, silently losing every signup); now it posts to our own
 *  /api/subscribe funnel, which persists durably before touching MailerLite.
 *
 *  - Progressive enhancement: it's a real <form action="/api/subscribe" method="post">, so it
 *    works with JS off (the route redirects back with ?subscribed=1). With JS, we intercept,
 *    fetch, and show inline success/error without a navigation.
 *  - UK GDPR: an explicit, UN-ticked consent checkbox (required) + a link to the privacy policy.
 *    No pre-ticked boxes, no assumed consent.
 *  - On-brand + mobile-first: stacks on small screens, inline on >=sm, existing design tokens.
 *
 *  Back-compat: `formAction` is the LEGACY mode — when passed (truthy), the component keeps its
 *  old behaviour (post the native form to that URL; render nothing when the URL is empty). This
 *  is what the sibling apps (loungemath/roammath) still use, so they are unchanged. ParkMath omits
 *  `formAction` and gets the durable-first /api/subscribe funnel below. `source` tags which
 *  surface converted; `privacyHref` lets a brand point at its own policy route. */
export function EmailCaptureSlot({
  hook,
  source,
  privacyHref = "/privacy",
  action = "/api/subscribe",
  formAction
}: {
  hook: string;
  source?: string;
  privacyHref?: string;
  action?: string;
  /** Legacy native-MailerLite mode. Pass to keep the old behaviour; omit for the funnel. */
  formAction?: string;
}) {
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  // LEGACY MODE: a call site explicitly opted into the old native-form behaviour. Empty URL →
  // render nothing (the historical contract those apps rely on). This branch never uses fetch
  // or the GDPR/consent funnel — it is preserved verbatim so other apps are untouched.
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
        <p className="mt-1 text-sm text-ink-muted">We&apos;ll email you when a UK airport changes its drop-off fee. Unsubscribe any time.</p>
      </div>
    );
  }

  return (
    <form action={action} method="post" onSubmit={onSubmit} className="rounded-card bg-surface p-6">
      <p className="font-semibold text-ink">{hook}</p>
      <input type="hidden" name="source" value={source ?? ""} />

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

      <div className="mt-3 flex items-start gap-2 text-xs text-ink-muted">
        <input
          id="consent-email"
          type="checkbox"
          name="consent"
          required
          className="mt-0.5 size-5 shrink-0 rounded border-ink/30 text-brand-accent focus:ring-2 focus:ring-brand-accent/30"
        />
        <label htmlFor="consent-email">
          Email me ParkMath&apos;s monthly UK drop-off fee update. I can unsubscribe any time. See our{" "}
          <a href={privacyHref} className="font-medium text-brand-accent underline underline-offset-2">privacy policy</a>.
        </label>
      </div>

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

import { resolveSoftwareSlot, DEFAULT_PARTNER_KEY } from "../lib/partners";

/**
 * Accounting-software affiliate rail — routed through the first-party `/go` surface.
 *
 * COMPLIANCE: this never renders a live outbound affiliate link while partners are
 * inactive (they all are in this repo). The CTA points at our own `/go/<partner>?s=<surface>`
 * route, which logs the click intent and — because every partner is INERT — 302s back to an
 * on-site page (createGoRoute fail-closed). So nothing leaves to a merchant and no merchant ID
 * is present, but we still capture demand signal per surface for when a deal goes live. There is
 * NO FCA-regulated product here — only bookkeeping software.
 */
export function SoftwareSlot({ clickref = "home" }: { clickref?: string }) {
  const slot = resolveSoftwareSlot(DEFAULT_PARTNER_KEY, clickref);
  const isInert = slot.kind === "inert" || !slot.url;
  // The CTA always travels through our own /go surface so the click is logged & attributed; the
  // route resolves to a live deeplink only once a deal is wired, otherwise it lands back on-site.
  const goHref = `/go/${DEFAULT_PARTNER_KEY}?s=${encodeURIComponent(clickref)}`;

  return (
    <aside
      aria-label="Sponsored — accounting software"
      className="rounded-card border border-dashed border-ink/20 bg-surface p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          <span className="rounded bg-ink/10 px-1.5 py-0.5 text-[10px] text-ink-muted">Ad</span>
          Sponsored
        </span>
        {isInert ? (
          <span className="rounded-full bg-ink/5 px-2.5 py-1 text-[11px] font-medium text-ink-muted">Coming soon</span>
        ) : null}
      </div>

      <p className="mt-2 text-sm font-semibold text-ink">
        Bookkeeping &amp; Self Assessment software for the self-employed
      </p>
      <p className="mt-1 text-sm text-ink-muted">
        Tools like {slot.partnerName ?? "FreeAgent"} track income, log expenses and help file your return.
        We&apos;ll feature a tested pick here once partnerships go live — clearly labelled, and it&apos;ll never
        change the figures we publish.
      </p>

      <a
        href={goHref}
        rel="sponsored noopener noreferrer"
        className="mf-press mt-3 inline-flex min-h-11 items-center rounded-full bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        {isInert ? "See bookkeeping tools" : `Try ${slot.partnerName} ↗`}
      </a>
    </aside>
  );
}

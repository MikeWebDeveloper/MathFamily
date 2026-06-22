import { resolveSoftwareSlot, DEFAULT_PARTNER_KEY } from "../lib/partners";

/**
 * Inert accounting-software affiliate rail.
 *
 * COMPLIANCE: this never renders a live outbound affiliate link while partners are
 * inactive (they all are in this repo). It shows a clearly-labelled "Ad / coming soon"
 * placeholder so the slot exists for layout + future monetisation, but nothing is
 * clickable to a merchant and no merchant ID is present. There is NO FCA-regulated
 * product here — only bookkeeping software.
 */
export function SoftwareSlot({ clickref = "home" }: { clickref?: string }) {
  const slot = resolveSoftwareSlot(DEFAULT_PARTNER_KEY, clickref);
  const isInert = slot.kind === "inert" || !slot.url;

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

      {isInert ? (
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="mt-3 inline-flex min-h-11 cursor-not-allowed items-center rounded-full bg-ink/10 px-4 py-2 text-sm font-semibold text-ink-muted"
        >
          Coming soon
        </button>
      ) : (
        <a
          href={slot.url ?? "#"}
          rel="sponsored noopener noreferrer"
          target="_blank"
          className="mt-3 inline-flex min-h-11 items-center rounded-full bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Try {slot.partnerName} ↗
        </a>
      )}
    </aside>
  );
}

import { resolveDentalSlot } from "../lib/partners";

/**
 * Inert affiliate slot. Renders a clearly-labelled, NON-clickable "coming soon" placeholder.
 * There is no outbound link, no merchant ID, and no tracking — by design (see lib/partners.ts).
 * This reserves the layout position so a reviewed, compliant partner can drop in later without
 * a redesign, while keeping the page free of any live financial promotion today.
 */
export function AffiliateBlock() {
  const slot = resolveDentalSlot();
  if (slot.active) return null; // never true today; guards against accidental activation
  return (
    <aside
      aria-label="Sponsored placeholder"
      className="rounded-card border border-dashed border-ink/15 bg-surface p-4 text-sm text-ink-muted"
    >
      <div className="flex items-center justify-between gap-3">
        <span>{slot.label}</span>
        <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          Coming soon
        </span>
      </div>
      <p className="mt-1 text-xs">
        We will only ever show partner links that are clearly labelled and independently chosen. No
        partner influences the figures on this page.
      </p>
    </aside>
  );
}

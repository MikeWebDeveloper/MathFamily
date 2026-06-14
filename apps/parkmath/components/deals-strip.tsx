import { activeSlotPartnerName } from "../lib/partners";

/** One subtle partner band. Neutral-referee voice, absolute-£ framing, no percentage
 *  anchoring. CTA routes to /airport-parking, where the tracked per-airport affiliate
 *  link fires — the home page never emits a generic affiliate click. */
export function DealsStrip() {
  const partner = activeSlotPartnerName("parking-prebook");
  return (
    <aside
      className="mf-rise-in mf-edge mf-sheen relative overflow-hidden rounded-card bg-surface p-4 sm:flex sm:items-center sm:justify-between sm:gap-4"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div>
        <p className="text-sm font-semibold text-ink">Pre-booking parking usually costs less than the gate price</p>
        <p className="mt-1 text-xs text-ink-muted">
          Compare pre-book vs drive-up prices at your airport.
          {partner ? (
            <span className="text-ink-muted/80"> *We may earn commission ({partner}). We show absolute prices and stay neutral.</span>
          ) : null}
        </p>
      </div>
      <a
        href="/airport-parking"
        className="mf-press mt-3 inline-flex min-h-11 items-center gap-1 rounded-card border border-brand-accent/40 bg-card px-4 text-sm font-semibold text-brand-accent outline-none transition hover:border-brand-accent focus-visible:ring-2 focus-visible:ring-brand-accent/40 sm:mt-0"
      >
        Compare parking{partner ? " *" : ""} <span aria-hidden>→</span>
      </a>
    </aside>
  );
}

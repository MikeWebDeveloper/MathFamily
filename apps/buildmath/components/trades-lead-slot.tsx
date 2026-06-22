import { resolveSlot } from "../lib/partners";

interface TradesLeadSlotProps {
  projectSlug: string;
  projectName: string;
}

/**
 * Trades-lead "green rail" — the planned revenue surface (Checkatrade / MyBuilder-style
 * "get matched with vetted local trades"). It is INERT for the MVP: no partner is live, so
 * `resolveSlot` always returns kind: "inert" and we render a clearly-labelled "Coming soon"
 * sponsored placeholder with NO outbound link. Labelled "Ad" / sponsored per disclosure rules.
 * No FCA-regulated (finance/insurance/loan) content — trades leads only.
 */
export function TradesLeadSlot({ projectSlug, projectName }: TradesLeadSlotProps) {
  const slot = resolveSlot(projectSlug);

  if (slot.kind === "inert" || !slot.url) {
    return (
      <aside
        aria-label="Sponsored — trades leads (coming soon)"
        className="rounded-card border border-dashed border-ink/20 bg-surface p-4"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Get matched with local trades
          </p>
          <span className="rounded-full border border-ink/15 bg-card px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
            Ad · coming soon
          </span>
        </div>
        <p className="mt-2 text-sm text-ink-muted">
          We&apos;re building a way to compare vetted local builders for your {projectName.toLowerCase()}.
          Nothing to click yet — and we&apos;ll always label sponsored links and never let them change the
          figures we show.
        </p>
      </aside>
    );
  }

  // Live state (only reachable once a partner is approved + activated in partners.json).
  return (
    <aside
      aria-label="Sponsored — find local trades"
      className="rounded-card border border-brand-accent/30 bg-brand-accent/[0.06] p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-accent">
          Find vetted local trades
        </p>
        <span className="rounded-full border border-ink/15 bg-card px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
          Ad · sponsored
        </span>
      </div>
      <p className="mt-1 text-lg font-bold text-ink">{slot.partnerName}</p>
      <a
        href={slot.url}
        rel="sponsored noopener noreferrer"
        target="_blank"
        className="mt-3 inline-flex min-h-11 items-center rounded-full bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Get quotes via {slot.partnerName} ↗
      </a>
      <p className="mt-3 text-xs text-ink-muted">
        Sponsored link — if you request quotes through {slot.partnerName}, BuildMath may earn a fee at no
        cost to you. It never changes the cost ranges we show.
      </p>
    </aside>
  );
}

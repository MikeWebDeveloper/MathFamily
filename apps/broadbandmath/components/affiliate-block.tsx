import { resolveSlot } from "../lib/partners";

interface AffiliateBlockProps {
  planSlug: string;
}

/**
 * INERT affiliate slot. In this scaffold `resolveSlot` always returns kind="inert", so this
 * renders a "Coming soon" placeholder labelled "Ad" / sponsored — never a live merchant link.
 * Green rail only (broadband switching); no FCA-regulated products.
 */
export function AffiliateBlock({ planSlug }: AffiliateBlockProps) {
  const slot = resolveSlot(planSlug);

  if (slot.kind === "inert" || !slot.url) {
    return (
      <aside
        aria-label="Sponsored slot (coming soon)"
        className="rounded-card border border-dashed border-ink/20 bg-surface p-4"
      >
        <div className="mb-1 flex items-center gap-2">
          <span className="inline-flex items-center rounded bg-ink/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-muted">
            Ad
          </span>
          <span className="text-xs font-medium text-ink-muted">Sponsored · coming soon</span>
        </div>
        <p className="text-sm font-semibold text-ink">Compare and switch broadband</p>
        <p className="mt-1 text-sm text-ink-muted">
          We&apos;re lining up an independent broadband-switching partner. When it&apos;s live it will appear here,
          clearly labelled as an ad. It will never change the figures we publish or which deal we show as cheapest.
        </p>
      </aside>
    );
  }

  // Live path (not reachable in scaffold) — labelled sponsored link, green rail only.
  return (
    <aside aria-label="Sponsored" className="rounded-card border border-brand-accent/30 bg-brand-accent/[0.06] p-4">
      <span className="inline-flex items-center rounded bg-brand-accent/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-accent">
        Ad
      </span>
      <p className="mt-1 text-sm font-semibold text-ink">{slot.partnerName}</p>
      <a
        href={slot.url}
        rel="sponsored noopener noreferrer"
        target="_blank"
        className="mt-3 inline-flex min-h-11 items-center rounded-full bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
      >
        Compare deals ↗
      </a>
      <p className="mt-3 text-xs text-ink-muted">
        Affiliate link — if you switch through {slot.partnerName}, BroadbandMath may earn a commission at no cost to
        you. This never affects the figures we publish.
      </p>
    </aside>
  );
}

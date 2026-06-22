import { resolveSlot, type GreenCategory } from "../lib/partners";

/**
 * GREEN affiliate slot — removals / conveyancing / surveys. Currently INERT: resolveSlot returns
 * `coming-soon` for every category (no live merchant IDs are configured). Renders a labelled,
 * non-clickable "coming soon" card with an "Ad" / sponsored disclosure so the placement is honest
 * before any partner is live. Once a partner is activated in partners.json it becomes a real,
 * disclosed affiliate link — but it can never be a mortgage/insurance (FCA-red) product.
 */

const CATEGORY_COPY: Record<GreenCategory, { title: string; blurb: string }> = {
  removals: {
    title: "Removals",
    blurb: "Compare quotes from vetted removal firms for your move."
  },
  conveyancing: {
    title: "Conveyancing",
    blurb: "Get fixed-fee quotes from solicitors and licensed conveyancers."
  },
  surveys: {
    title: "RICS surveys",
    blurb: "Compare prices for a Level 2 or Level 3 RICS home survey."
  }
};

export function AffiliateSlot({ category, clickref }: { category: GreenCategory; clickref: string }) {
  const slot = resolveSlot(category, clickref);
  const copy = CATEGORY_COPY[category];

  return (
    <div
      data-testid={`affiliate-slot-${category}`}
      data-affiliate-active={slot.kind === "affiliate" ? "true" : "false"}
      className="rounded-card border border-dashed border-ink/15 bg-surface p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink">{copy.title}</p>
        <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
          Ad · sponsored
        </span>
      </div>
      <p className="mt-1 text-sm text-ink-muted">{copy.blurb}</p>
      {slot.kind === "affiliate" && slot.url ? (
        <a
          href={slot.url}
          rel="sponsored nofollow"
          className="mt-3 inline-flex min-h-10 items-center rounded-lg bg-brand-accent px-3 py-2 text-sm font-semibold text-white"
        >
          {slot.label}
        </a>
      ) : (
        <p className="mt-3 inline-flex min-h-9 items-center rounded-lg border border-ink/15 bg-card px-3 py-1.5 text-xs font-medium text-ink-muted">
          Comparison coming soon
        </p>
      )}
    </div>
  );
}

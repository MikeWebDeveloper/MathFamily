import Link from "next/link";
import { resolveSlot, type GreenCategory } from "../lib/partners";

/**
 * GREEN affiliate slot — removals / conveyancing / surveys. The rail is still INERT (resolveSlot
 * returns `coming-soon` for every category; no live merchant IDs are configured), but the CTA now
 * routes through the shared, surface-tagged `/go/<category>?s=<surface>` attribution route so every
 * click is logged even before a partner is wired. `/go` is fail-closed: with no live deeplink it
 * 302s back on-site (never a 404, never a bare affiliate link). Once a partner is activated in
 * partners.json the same /go path resolves to a real, disclosed deeplink — but it can never be a
 * mortgage/insurance (FCA-red) product.
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

export function AffiliateSlot({ category, surface }: { category: GreenCategory; surface: string }) {
  const slot = resolveSlot(category, surface);
  const copy = CATEGORY_COPY[category];
  // Surface-tagged attribution route. Inert today (resolveDeeplink returns null → fail-closed 302
  // back on-site), but the click is logged so we capture demand before any deal is wired.
  const goHref = `/go/${category}?s=${encodeURIComponent(surface)}`;

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
      <Link
        href={goHref}
        rel="sponsored nofollow"
        prefetch={false}
        className="mt-3 inline-flex min-h-10 items-center rounded-lg bg-brand-accent px-3 py-2 text-sm font-semibold text-white"
      >
        {slot.kind === "affiliate" ? slot.label : "Compare quotes"}
      </Link>
    </div>
  );
}

import { resolveFoodSlot } from "../lib/partners";

/**
 * INERT pet-food affiliate slot (GREEN rail). While gated (no live merchant IDs) this renders a
 * "coming soon" card with clear "Ad" / sponsored labelling and NO outbound link. When a real
 * food-subscription partner is activated in partners.json it becomes a labelled sponsored link.
 * It can never render an insurance link by construction (resolveFoodSlot only returns food slots).
 */
export function FoodAffiliateSlot({ speciesSlug, species }: { speciesSlug: string; species: string }) {
  const slot = resolveFoodSlot(speciesSlug);

  if (slot.kind === "inert") {
    return (
      <aside
        aria-label="Sponsored slot (coming soon)"
        className="rounded-card border border-dashed border-ink/20 bg-surface p-4"
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-ink">Save on {species.toLowerCase()} food</p>
          <span className="inline-flex items-center rounded bg-ink/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-muted">
            Ad
          </span>
        </div>
        <p className="mt-1 text-sm text-ink-muted">
          A vetted pet-food subscription deal is coming soon. We&apos;ll only ever feature pet-food offers
          here, always clearly labelled — never insurance.
        </p>
        <p className="mt-2 text-xs font-medium text-ink-muted">Coming soon</p>
      </aside>
    );
  }

  // Live path (only reachable once a real food partner is activated — gated, not committed).
  return (
    <aside aria-label="Sponsored: pet food subscription" className="rounded-card border border-brand-accent/30 bg-brand-accent/[0.06] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink">Save on {species.toLowerCase()} food with {slot.partnerName}</p>
        <span className="inline-flex items-center rounded bg-ink/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-muted">
          Ad
        </span>
      </div>
      <a
        href={slot.url!}
        rel="sponsored noopener noreferrer"
        target="_blank"
        className="mt-3 inline-flex min-h-11 items-center rounded-full bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        See the offer ↗
      </a>
      <p className="mt-2 text-xs text-ink-muted">
        Sponsored link — if you subscribe through {slot.partnerName}, PetMath may earn a commission at no
        cost to you. This never changes the cost figures we show.
      </p>
    </aside>
  );
}

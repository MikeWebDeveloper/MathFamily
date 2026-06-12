import { resolveSlot, type SlotId } from "../lib/partners";

export function AffiliateBlock({ slotId, airportSlug, officialUrl }: { slotId: SlotId; airportSlug: string; officialUrl: string }) {
  const slot = resolveSlot(slotId, airportSlug, officialUrl);
  return (
    <div className="rounded-card border border-brand-accent/30 bg-blue-50 p-4">
      {slot.disclosureRequired ? (
        <span className="mb-2 inline-block rounded border border-ink-muted/40 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Ad</span>
      ) : null}
      <a
        href={slot.url}
        rel={slot.kind === "affiliate" ? "sponsored noopener noreferrer" : "noopener noreferrer"}
        target="_blank"
        className="block font-semibold text-brand-accent underline underline-offset-4"
      >
        {slot.label} ↗
      </a>
      {slot.disclosureRequired ? (
        <p className="mt-2 text-sm text-ink-muted">
          Affiliate link — if you book through {slot.partnerName}, ParkMath earns a commission, at no
          cost to you. We rank parking options by price only; this never affects which we show as cheapest.
        </p>
      ) : null}
    </div>
  );
}

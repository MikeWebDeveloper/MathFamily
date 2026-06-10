import { resolveSlot, type SlotId } from "@/lib/partners";

export function AffiliateBlock({ slotId, airportSlug, officialUrl }: { slotId: SlotId; airportSlug: string; officialUrl: string }) {
  const slot = resolveSlot(slotId, airportSlug, officialUrl);
  return (
    <div className="rounded-card border border-brand-accent/30 bg-blue-50 p-4">
      <a
        href={slot.url}
        rel={slot.kind === "affiliate" ? "sponsored noopener noreferrer" : "noopener noreferrer"}
        target="_blank"
        className="font-semibold text-brand-accent underline underline-offset-4"
      >
        {slot.label} ↗
      </a>
      {slot.disclosureRequired ? (
        <p className="mt-2 text-sm text-ink-muted">
          Affiliate link: if you buy through {slot.partnerName}, RoamMath may earn a commission at no cost to you. This
          never affects which option we show as cheapest.
        </p>
      ) : null}
    </div>
  );
}

import { resolveSlot, goLink } from "@/lib/partners";

// "Ad"-labelled, fail-closed Priority Pass affiliate block. While the programme is
// DORMANT (active:false in partners.json) the slot resolves to "official", this
// renders nothing, and /go 404s — no bare/unpaid links ever ship. Once Mike confirms
// the Priority Pass affiliate join and the slot+partner flip active, the CTA routes
// through /go (first-party click log → AWIN deep link) and shows the required "Ad" label.
export function AffiliateBlock({ itemKey }: { itemKey: string }) {
  const slot = resolveSlot("primary", itemKey, "");
  if (slot.kind !== "affiliate") return null;
  return (
    <aside className="mf-sheen rounded-card border border-ink/10 bg-card p-4 text-sm">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded bg-ink/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">Ad</span>
        {slot.disclosureRequired ? <span className="text-ink-muted">Affiliate link — we may earn a commission, at no cost to you.</span> : null}
      </div>
      <a href={goLink("detail", itemKey, "primary")} rel="sponsored nofollow" className="font-medium text-brand-accent underline underline-offset-4">
        {slot.partnerName ? `Join ${slot.partnerName} →` : slot.label}
      </a>
      {slot.termsUrl ? <a href={slot.termsUrl} className="ml-3 text-xs text-ink-muted underline">Terms ↗</a> : null}
    </aside>
  );
}

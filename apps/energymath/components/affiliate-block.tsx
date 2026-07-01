import { resolveSlot, type PartnerCategory } from "../lib/partners";

const COPY: Record<PartnerCategory, { title: string; blurb: string }> = {
  solar: {
    title: "Compare solar panel quotes with GreenMatch",
    blurb: "Get matched with vetted MCS-certified solar installers and compare quotes — free, no obligation."
  },
  "heat-pump": {
    title: "Get heat pump quotes with GreenMatch",
    blurb: "Compare quotes from accredited heat-pump installers and check grant eligibility — free, no obligation."
  },
  switching: {
    title: "Compare energy tariffs",
    blurb: "See whether a fixed deal beats the price cap for your usage."
  }
};

/**
 * INERT affiliate slot (the green rail). In this MVP every partner is gated
 * (active: false, no deeplink), so this ALWAYS renders the "coming soon" state
 * with an "Ad" label — no outbound link, no merchant ID. When a partner goes
 * live it renders a labelled, rel="sponsored" CTA that routes through the
 * surface-tagged `/go` redirect (`/go/<category>/<region>?s=<surface>`), so every
 * click is logged + attributed before the 302 — never a bare affiliate link.
 *
 * Names GreenMatch by name even while inert (matching RoamMath's eSIM inert copy,
 * which names Airalo/Holafly/Saily) — see lib/partners.ts for why solar/heat-pump
 * are gated on GreenMatch specifically and what's still needed to flip them live.
 *
 * COMPLIANCE: green/energy categories only — no FCA-regulated products.
 */
export function AffiliateBlock({
  category,
  regionSlug,
  surface
}: {
  category: PartnerCategory;
  regionSlug: string;
  /** Surface tag for /go attribution, e.g. "home" | "region". */
  surface: string;
}) {
  const slot = resolveSlot(category, regionSlug);
  const copy = COPY[category];
  const goHref = `/go/${category}/${regionSlug}?s=${encodeURIComponent(surface)}`;

  return (
    <aside
      aria-label="Sponsored partner slot"
      className="rounded-card border border-ink/10 bg-card p-4 sm:p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-ink">{copy.title}</h2>
        <span className="shrink-0 rounded-full border border-ink/15 bg-surface px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-muted">
          Ad
        </span>
      </div>
      <p className="mt-1 text-sm text-ink-muted">{copy.blurb}</p>

      {slot.kind === "affiliate" && slot.url ? (
        <>
          {slot.disclosureRequired ? (
            <p className="mt-3 text-xs text-ink-muted">
              We may earn a commission if you request a quote through this link — at no extra cost to
              you.
            </p>
          ) : null}
          <a
            href={goHref}
            rel="sponsored noopener"
            target="_blank"
            className="mt-2 inline-flex min-h-11 items-center rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white outline-none hover:bg-brand-accent/90 focus-visible:ring-2 focus-visible:ring-brand-accent"
          >
            {slot.label}
          </a>
        </>
      ) : (
        <p className="mt-3 inline-flex items-center gap-2 rounded-lg border border-dashed border-ink/20 px-3 py-2 text-sm font-medium text-ink-muted">
          <span aria-hidden className="h-2 w-2 rounded-full bg-ink/30" />
          Coming soon — partner not yet live
        </p>
      )}
    </aside>
  );
}

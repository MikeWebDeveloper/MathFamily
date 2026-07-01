export interface TravelRailCardProps {
  kind: "car-hire" | "travel-insurance";
  countryName: string;
  affiliateUrl: string;
  partnerName: string;
  disclosureRequired: boolean;
}

export function TravelRailCard({
  kind,
  countryName,
  affiliateUrl,
  partnerName,
  disclosureRequired,
}: TravelRailCardProps) {
  if (!disclosureRequired) return null;

  const heading =
    kind === "car-hire"
      ? `Renting a car in ${countryName}?`
      : `Travel insurance for ${countryName}`;

  const valueProposition =
    kind === "car-hire"
      ? "Compare prices from local and international car hire companies."
      : "Single-trip cover including medical, cancellation and car-hire excess.";

  const ctaText =
    kind === "car-hire"
      ? "Compare car hire prices"
      : "Get a travel insurance quote";

  return (
    <div className="rounded-card border border-brand-accent/30 bg-brand-accent/[0.06] p-4 dark:border-brand-accent/20 dark:bg-brand-accent/[0.08]">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-accent">
        {kind === "car-hire" ? "✦ Car hire" : "✦ Travel insurance"}
      </p>
      <p className="text-lg font-bold text-ink">{heading}</p>
      <p className="mt-1 text-sm text-ink-muted">{valueProposition}</p>
      <a
        href={affiliateUrl}
        rel="sponsored noopener noreferrer"
        target="_blank"
        className="mt-4 inline-flex min-h-11 items-center rounded-full bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        {ctaText} ↗
      </a>
      <p className="mt-3 text-xs text-ink-muted">
        Affiliate link — RoamMath may earn a commission if you buy through this link, at no cost to you.
        This does not affect which options we show or our pricing data.
      </p>
    </div>
  );
}

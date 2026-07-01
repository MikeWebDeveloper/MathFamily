export interface EsimPickCardProps {
  providerName: string | null;
  bundleName: string | null;
  totalFormatted: string | null;
  countryName: string;
  affiliateUrl: string;
  disclosureRequired: boolean;
}

export function EsimPickCard({
  providerName,
  bundleName,
  totalFormatted,
  countryName,
  affiliateUrl,
  disclosureRequired,
}: EsimPickCardProps) {
  if (!providerName || !disclosureRequired) {
    return (
      <div className="rounded-card border border-ink/10 bg-card p-4">
        <p className="mb-2 text-sm font-medium text-ink-muted">eSIM option</p>
        <a
          href={affiliateUrl}
          rel="noopener noreferrer"
          target="_blank"
          className="rounded font-semibold text-accent-strong underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/40"
        >
          Check live eSIM prices ↗
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-brand-accent/30 bg-brand-accent/[0.06] p-4 dark:border-brand-accent/20 dark:bg-brand-accent/[0.08]">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent-strong">
        ✦ Best eSIM pick
      </p>
      <p className="text-lg font-bold text-ink">{providerName}</p>
      {totalFormatted !== null && (
        <p className="text-3xl font-bold tracking-tight text-ink">{totalFormatted}</p>
      )}
      {bundleName && (
        <p className="mt-0.5 text-sm text-ink-muted">
          {countryName} · {bundleName}
        </p>
      )}
      <a
        href={affiliateUrl}
        rel="sponsored noopener noreferrer"
        target="_blank"
        className="mt-4 inline-flex min-h-11 items-center rounded-full bg-accent-solid px-5 py-2.5 text-sm font-semibold text-white outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-brand-accent/50"
      >
        Buy with {providerName} ↗
      </a>
      <p className="mt-3 text-xs text-ink-muted">
        Affiliate link — if you buy through {providerName}, RoamMath may earn a commission at no cost to you.
        This never affects which option we show as cheapest.
      </p>
    </div>
  );
}

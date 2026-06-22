import { formatPence } from "@mathfamily/engine";
import { EsimPickCard } from "@mathfamily/ui";
import { resolveSlot } from "../lib/partners";

interface AffiliateBlockProps {
  providerName: string | null;
  countrySlug: string;
  officialUrl: string;
  bundleName: string | null;
  totalPence: number | null;
  countryName: string;
}

export function AffiliateBlock({
  providerName,
  countrySlug,
  officialUrl,
  bundleName,
  totalPence,
  countryName,
}: AffiliateBlockProps) {
  const slot = resolveSlot(providerName, countrySlug, officialUrl);
  const totalFormatted = totalPence !== null ? formatPence(totalPence) : null;

  // Inert state: no live merchant IDs are configured (all eSIM partners are
  // gated off in partners.json). Render a tasteful "coming soon" slot that still
  // helps the user (links to the provider's own page) and carries the "Ad" /
  // sponsored labelling so the eventual paid placement is pre-disclosed.
  // Green rail (eSIM) only — uses the brand-accent token, never an FCA-red rail.
  if (slot.kind !== "affiliate") {
    return (
      <div
        className="relative rounded-card border border-brand-accent/25 bg-brand-accent/[0.05] p-4 dark:border-brand-accent/20"
        data-testid="esim-slot-inert"
      >
        <span className="absolute right-4 top-4 rounded border border-ink/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-ink-muted">
          Ad
        </span>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-accent">
          eSIM picks — coming soon
        </p>
        <p className="text-sm text-ink-muted">
          We&apos;re finalising partnerships with the major eSIM providers
          (Airalo, Holafly, Saily). Until then, here&apos;s the provider&apos;s
          own page for {countryName}
          {totalFormatted ? <> — best tracked bundle from <strong className="text-ink">{totalFormatted}</strong></> : null}.
        </p>
        <a
          href={slot.url}
          rel="noopener noreferrer"
          target="_blank"
          className="mt-3 inline-flex min-h-11 items-center font-semibold text-brand-accent underline underline-offset-4"
        >
          Check live eSIM prices ↗
        </a>
        <p className="mt-3 text-xs text-ink-muted/70">
          This slot will become a sponsored (affiliate) placement. It will never
          affect which option we show as cheapest.
        </p>
      </div>
    );
  }

  // Live affiliate state (gated until partners go active): defer to the shared
  // EsimPickCard, which renders the sponsored disclosure + "Buy with …" CTA.
  return (
    <EsimPickCard
      providerName={slot.partnerName}
      bundleName={bundleName}
      totalFormatted={totalFormatted}
      countryName={countryName}
      affiliateUrl={slot.url}
      disclosureRequired={slot.disclosureRequired}
    />
  );
}

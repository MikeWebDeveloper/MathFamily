import { resolveSlot } from "@/lib/partners";

interface AffiliateBlockProps {
  providerName: string | null;
  countrySlug: string;
  officialUrl: string;
}

export function AffiliateBlock({ providerName, countrySlug, officialUrl }: AffiliateBlockProps) {
  const slot = resolveSlot(providerName, countrySlug, officialUrl);
  return (
    <div className="rounded-card border border-brand-accent/30 bg-blue-50 dark:bg-brand-accent/[0.08] dark:border-brand-accent/20 p-4">
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
          Affiliate link: if you buy through {slot.partnerName}, RoamMath may earn a commission at no cost to you. This never affects which option we show as cheapest.
        </p>
      ) : null}
    </div>
  );
}

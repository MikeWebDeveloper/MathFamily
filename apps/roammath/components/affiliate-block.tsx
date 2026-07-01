import { formatPence } from "@mathfamily/engine";
import { EsimPickCard } from "@mathfamily/ui";
import { resolveSlot, goLink, type GoTarget } from "../lib/partners";

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
  // Route only a genuinely live affiliate click through /go for click measurement. The non-affiliate
  // fallback keeps linking straight to `officialUrl` (the exact per-country source citation) unchanged
  // — never traded away for a generic /go destination, since resolveGoTarget's fallback only knows a
  // provider's generic homepage, not this specific country's verified source.
  const href =
    slot.kind === "affiliate" && providerName
      ? goLink("hub", countrySlug, `esim:${providerName.toLowerCase()}` as GoTarget)
      : slot.url;
  return (
    <EsimPickCard
      providerName={slot.partnerName}
      bundleName={bundleName}
      totalFormatted={totalFormatted}
      countryName={countryName}
      affiliateUrl={href}
      disclosureRequired={slot.disclosureRequired}
    />
  );
}

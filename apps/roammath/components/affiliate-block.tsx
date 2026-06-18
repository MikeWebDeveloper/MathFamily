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

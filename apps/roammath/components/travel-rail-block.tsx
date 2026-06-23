import { TravelRailCard } from "@mathfamily/ui";
import { resolveCarHireSlot, resolveTravelInsuranceSlot } from "../lib/partners";

interface TravelRailBlockProps {
  countrySlug: string;
  countryName: string;
  kind: "car-hire" | "travel-insurance";
}

export function TravelRailBlock({ countrySlug, countryName, kind }: TravelRailBlockProps) {
  const slot =
    kind === "car-hire"
      ? resolveCarHireSlot(countrySlug)
      : resolveTravelInsuranceSlot(countrySlug);

  if (slot.kind !== "affiliate") return null;

  return (
    <TravelRailCard
      kind={kind}
      countryName={countryName}
      affiliateUrl={slot.url}
      partnerName={slot.partnerName ?? ""}
      disclosureRequired={slot.disclosureRequired}
    />
  );
}

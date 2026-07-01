import { TravelRailCard } from "@mathfamily/ui";
import { resolveCarHireSlot, resolveTravelInsuranceSlot, goLink, type GoTarget } from "../lib/partners";

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

  // Unchanged fail-closed gate: no active partner ⇒ render nothing at all (never a /go link to a
  // dead category). Only once live does the CTA route through /go for click measurement — same
  // priority order as resolveCarHireSlot/resolveTravelInsuranceSlot, so the destination the route
  // rebuilds is byte-identical to `slot.url`.
  if (slot.kind !== "affiliate") return null;

  return (
    <TravelRailCard
      kind={kind}
      countryName={countryName}
      affiliateUrl={goLink("hub", countrySlug, kind as GoTarget)}
      partnerName={slot.partnerName ?? ""}
      disclosureRequired={slot.disclosureRequired}
    />
  );
}

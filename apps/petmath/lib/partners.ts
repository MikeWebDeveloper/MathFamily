import partnersJson from "./partners.json";

/**
 * PetMath affiliate slots. ALL slots are currently INERT (no live merchant IDs — gated until Mike
 * approves a real signup). Compliance rules baked in here:
 *  - GREEN rail only: the single permitted affiliate category is pet FOOD subscription.
 *  - Pet INSURANCE is AMBER (FCA): it NEVER becomes a live affiliate link. There is no insurance
 *    partner in partners.json and resolveFoodSlot only ever returns food partners.
 *  - Until a partner is `active` AND has a real http(s) deeplink, the slot resolves to an inert
 *    "coming soon" placeholder with "Ad"/sponsored labelling, no outbound link.
 */

export interface ResolvedFoodSlot {
  /** "live" only when a real, active affiliate deeplink exists; otherwise "inert". */
  kind: "live" | "inert";
  partnerName: string | null;
  /** Outbound URL — only present when kind === "live". */
  url: string | null;
  disclosureRequired: boolean;
}

interface PartnerConfig {
  name: string;
  category: string;
  active: boolean;
  deeplinkTemplate: string;
  trackingNote: string;
}

export function buildAffiliateUrl(template: string, speciesSlug: string): string {
  const clickref = `food-${speciesSlug}`;
  return template.replaceAll("{speciesSlug}", speciesSlug).replaceAll("{clickref}", clickref);
}

/**
 * Resolve the pet-food affiliate slot. Returns an inert placeholder unless a food-category partner
 * is explicitly active with a real http deeplink. By construction this can never return an
 * insurance link.
 */
export function resolveFoodSlot(speciesSlug: string): ResolvedFoodSlot {
  const inert: ResolvedFoodSlot = { kind: "inert", partnerName: null, url: null, disclosureRequired: false };

  const partners = partnersJson.partners as Record<string, PartnerConfig>;
  const firstActiveFood = Object.values(partners).find(
    (p) => p.category === "pet-food-subscription" && p.active && p.deeplinkTemplate.startsWith("http")
  );

  if (!firstActiveFood) return inert;

  return {
    kind: "live",
    partnerName: firstActiveFood.name,
    url: buildAffiliateUrl(firstActiveFood.deeplinkTemplate, speciesSlug),
    disclosureRequired: true,
  };
}

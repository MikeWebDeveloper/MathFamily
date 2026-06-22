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

/**
 * Surface-tagged `/go` deeplink resolver for the shared `createGoRoute`. The catch-all path is
 * `/go/food/<speciesSlug>?s=<surface>`. Only the pet-FOOD rail is ever routed here — by construction
 * this can never return an insurance link (insurance stays an inert, non-affiliate estimate line).
 *
 * Fail-CLOSED: while every food partner is inactive (gated, no live merchant IDs) this returns
 * `null`, so `createGoRoute` still logs the click intent and 302s back to an on-site page — never a
 * broken/bare affiliate link, never a 404. Ship the surface before deals are wired and lose no signal.
 */
export function resolveDeeplink(parts: string[], _surface: string): string | null {
  const [category, speciesSlug] = parts;
  if (category !== "food" || !speciesSlug) return null;

  const slot = resolveFoodSlot(speciesSlug);
  return slot.kind === "live" ? slot.url : null;
}

import partnersJson from "./partners.json";

/**
 * Affiliate-slot resolution for MoveMath's GREEN rails (removals, conveyancing, surveys).
 *
 * Every slot is currently INERT: `active: false` with an empty deeplink, so `resolveSlot`
 * always returns `{ kind: "coming-soon" }`. No live merchant IDs are present and none can be
 * activated without first setting `active: true` AND a real https deeplink. This mirrors the
 * roammath partners pattern.
 *
 * MORTGAGES / INSURANCE / any FCA-regulated product are deliberately NOT represented here.
 * The mortgage slot is a separate, explicitly FCA-gated "coming soon" component
 * (components/mortgage-slot.tsx) and can never be turned into a live rail through this file.
 */

export type GreenCategory = "removals" | "conveyancing" | "surveys";

export interface PartnerConfig {
  name: string;
  category: GreenCategory;
  active: boolean;
  deeplinkTemplate: string;
  trackingNote: string;
}

export interface ResolvedSlot {
  kind: "affiliate" | "coming-soon";
  category: GreenCategory;
  label: string;
  partnerName: string | null;
  url: string | null;
  disclosureRequired: boolean;
}

export function buildAffiliateUrl(template: string, clickref: string): string {
  return template.replaceAll("{clickref}", clickref);
}

export function resolveSlot(category: GreenCategory, clickref: string): ResolvedSlot {
  const comingSoon: ResolvedSlot = {
    kind: "coming-soon",
    category,
    label: "Comparison coming soon",
    partnerName: null,
    url: null,
    disclosureRequired: false
  };

  const partner = (partnersJson.partners as Record<string, PartnerConfig>)[category];
  if (!partner || !partner.active || !partner.deeplinkTemplate.startsWith("http")) {
    return comingSoon;
  }

  return {
    kind: "affiliate",
    category,
    label: `Compare with ${partner.name}`,
    partnerName: partner.name,
    url: buildAffiliateUrl(partner.deeplinkTemplate, clickref),
    disclosureRequired: true
  };
}

/** True iff NO green rail is currently live (the MVP invariant). */
export function allGreenSlotsInert(): boolean {
  const partners = partnersJson.partners as Record<string, PartnerConfig>;
  return Object.values(partners).every((p) => !p.active || !p.deeplinkTemplate.startsWith("http"));
}

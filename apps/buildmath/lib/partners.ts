import partnersJson from "./partners.json";

export interface ResolvedSlot {
  /** "inert" until a partner is approved + activated; "affiliate" once a live deeplink exists. */
  kind: "inert" | "affiliate";
  url: string | null;
  partnerName: string | null;
  disclosureRequired: boolean;
}

interface PartnerConfig {
  name: string;
  active: boolean;
  deeplinkTemplate: string;
  trackingNote: string;
}

export function buildAffiliateUrl(template: string, projectSlug: string): string {
  const clickref = `lead-${projectSlug}`;
  return template.replaceAll("{projectSlug}", projectSlug).replaceAll("{clickref}", clickref);
}

/**
 * Resolve the trades-lead slot for a project. EVERY partner is currently inactive (no live
 * merchant IDs — gated), so this always returns an INERT slot: the UI shows a "Coming soon"
 * sponsored placeholder, never a live affiliate link. When a partner is approved, set
 * `active: true` + a real `deeplinkTemplate` in partners.json and this flips to "affiliate".
 */
export function resolveSlot(projectSlug: string): ResolvedSlot {
  const inert: ResolvedSlot = { kind: "inert", url: null, partnerName: null, disclosureRequired: false };

  const partners = partnersJson.partners as Record<string, PartnerConfig>;
  const firstActive = Object.values(partners).find(
    (p) => p.active && p.deeplinkTemplate.startsWith("http")
  );
  if (!firstActive) return inert;

  return {
    kind: "affiliate",
    url: buildAffiliateUrl(firstActive.deeplinkTemplate, projectSlug),
    partnerName: firstActive.name,
    disclosureRequired: true,
  };
}

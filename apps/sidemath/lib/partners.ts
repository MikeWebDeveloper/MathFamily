import partnersJson from "./partners.json";

/**
 * SideMath affiliate slot resolver. Mirrors roammath's pattern but the rail here is
 * accounting / bookkeeping SOFTWARE (FreeAgent / QuickBooks / Xero style), not eSIMs.
 *
 * COMPLIANCE: every partner ships `active: false` with an empty deeplinkTemplate, so
 * resolveSlot ALWAYS returns the inert "coming soon" slot. No live merchant IDs are in
 * this repo — they are gated and added later. There is intentionally no FCA-regulated
 * rail (no banking/credit/investment/insurance product) — only software tools.
 */

export interface ResolvedSoftwareSlot {
  /** "inert" until a real, gated merchant link is wired in. */
  kind: "inert" | "affiliate";
  partnerName: string | null;
  category: string | null;
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

export function buildAffiliateUrl(template: string, clickref: string): string {
  return template.replaceAll("{clickref}", clickref);
}

/** Resolve the software slot for a given partner key. Inert unless the partner is
 *  active AND carries a real https deeplink — neither is true in this repo. */
export function resolveSoftwareSlot(partnerKey: string, clickref: string): ResolvedSoftwareSlot {
  const partner = (partnersJson.partners as Record<string, PartnerConfig>)[partnerKey.toLowerCase()];

  const inert: ResolvedSoftwareSlot = {
    kind: "inert",
    partnerName: partner?.name ?? null,
    category: partner?.category ?? null,
    url: null,
    disclosureRequired: false
  };

  if (!partner?.active || !partner.deeplinkTemplate.startsWith("http")) {
    return inert;
  }

  return {
    kind: "affiliate",
    partnerName: partner.name,
    category: partner.category,
    url: buildAffiliateUrl(partner.deeplinkTemplate, clickref),
    disclosureRequired: true
  };
}

/** The default partner shown in the rail (still inert). */
export const DEFAULT_PARTNER_KEY = "freeagent";

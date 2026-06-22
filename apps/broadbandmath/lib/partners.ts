/**
 * Affiliate partner config for BroadbandMath.
 *
 * COMPLIANCE (hard rules for this app):
 *  - GREEN RAIL ONLY: broadband switching / comparison affiliates are permitted.
 *  - NO FCA-RED RAILS: never wire credit, loans, insurance, BNPL, or any regulated
 *    financial product. Those require FCA authorisation we do not have.
 *  - EVERY slot is INERT in this scaffold: `active: false` and no live deeplink/merchant ID.
 *    The UI renders a "Coming soon" placeholder labelled "Ad" / sponsored. Nothing clicks
 *    through to a live merchant.
 *
 * To go live later, a human must: sign the affiliate agreement, paste the approved deeplink
 * template (with {planSlug}/{clickref} placeholders), and flip `active: true`. Until then
 * resolveSlot always returns the inert placeholder.
 */

export type RailKind = "broadband-switching"; // green only — no FCA-regulated rails permitted

export interface PartnerConfig {
  name: string;
  rail: RailKind;
  active: boolean;
  /** Empty until a signed agreement provides the approved deeplink. */
  deeplinkTemplate: string;
  trackingNote: string;
}

export const PARTNERS: Record<string, PartnerConfig> = {
  comparison: {
    name: "Broadband comparison partner",
    rail: "broadband-switching",
    active: false,
    deeplinkTemplate: "",
    trackingNote: "INERT — fill only after a signed broadband-switching affiliate agreement. Green rail only."
  }
};

export interface ResolvedSlot {
  /** "inert" ⇒ render the Coming-soon placeholder; "affiliate" ⇒ a live, labelled link. */
  kind: "inert" | "affiliate";
  url: string | null;
  partnerName: string;
  rail: RailKind;
  disclosureRequired: boolean;
}

export function buildAffiliateUrl(template: string, planSlug: string): string {
  const clickref = `bb-${planSlug}`;
  return template.replaceAll("{planSlug}", planSlug).replaceAll("{clickref}", clickref);
}

/** Always returns an inert slot in this scaffold. The `active` + `http` guard means even a
 *  stray non-empty template can't accidentally go live without an explicit flip. */
export function resolveSlot(planSlug: string, partnerKey = "comparison"): ResolvedSlot {
  const partner = PARTNERS[partnerKey];
  const inert: ResolvedSlot = {
    kind: "inert",
    url: null,
    partnerName: partner?.name ?? "Broadband comparison partner",
    rail: "broadband-switching",
    disclosureRequired: true
  };

  if (!partner || !partner.active || !partner.deeplinkTemplate.startsWith("http")) {
    return inert;
  }

  return {
    kind: "affiliate",
    url: buildAffiliateUrl(partner.deeplinkTemplate, planSlug),
    partnerName: partner.name,
    rail: partner.rail,
    disclosureRequired: true
  };
}

/**
 * Deeplink resolver for the shared `/go/[...go]` route (`createGoRoute`). The first path part is
 * the plan/target slug; the surface ("home" | "provider" | "speed" | spoke) comes from `?s=`.
 *
 * INERT-SAFE / fail-CLOSED: the broadband-switching rail has no signed agreement and no live
 * deeplink yet, so this ALWAYS returns `null`. createGoRoute then logs the click intent and
 * 302s back to an on-site page — never a 404, never a bare/broken affiliate link. The `/go`
 * surface ships now so we capture switching-intent signal before any deal is wired; the slot
 * only becomes live once a human flips `active` AND pastes a real https deeplink template.
 */
export function resolveDeeplink(parts: string[], _surface: string): string | null {
  const planSlug = parts[0] ?? "home";
  const slot = resolveSlot(planSlug);
  return slot.kind === "affiliate" ? slot.url : null;
}

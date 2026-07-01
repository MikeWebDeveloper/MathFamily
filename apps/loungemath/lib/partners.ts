import partnersJson from "./partners.json";

// Fail-closed affiliate resolver, ported from ParkMath. A CTA links to a
// first-party /go/<key>/<target> path; the redirect route rebuilds the EXACT
// AWIN deep link here. If the slot/partner is inactive or unconfigured, every
// resolver returns null and the /go route 404s — it can NEVER become an open
// redirect or emit a bare awin1.com link. Leave partners active:false until the
// network approves the programme, then flip active + set awinmid/landingUrl.

interface PartnerConfig { name: string; awinmid: string | null; active: boolean; landingUrl?: string; termsUrl?: string; }
interface SlotConfig { id: string; partnerIds: string[]; active: boolean; }
const config = partnersJson as unknown as { awin: { publisherId: string }; partners: Record<string, PartnerConfig>; slots: SlotConfig[]; };

export function buildAwinLink(args: { awinmid: string; publisherId: string; key: string; ued?: string; clickrefSuffix?: string }): string {
  const params = new URLSearchParams({
    awinmid: args.awinmid,
    awinaffid: args.publisherId,
    clickref: `loungemath-${args.key}${args.clickrefSuffix ? `-${args.clickrefSuffix}` : ""}`,
  });
  if (args.ued) params.set("ued", args.ued);
  return `https://www.awin1.com/cread.php?${params.toString()}`;
}

export interface ResolvedSlot { kind: "affiliate" | "official"; url: string; label: string; partnerName: string | null; termsUrl: string | null; disclosureRequired: boolean; }

export function resolveSlot(slotId: string, key: string, officialUrl: string): ResolvedSlot {
  const slot = config.slots.find((s) => s.id === slotId);
  if (slot?.active) {
    for (const partnerId of slot.partnerIds) {
      const partner = config.partners[partnerId];
      if (!partner?.active || !partner.awinmid) continue;
      return {
        kind: "affiliate",
        url: buildAwinLink({ awinmid: partner.awinmid, publisherId: config.awin.publisherId, key, ued: partner.landingUrl }),
        label: `Compare prices with ${partner.name}`,
        partnerName: partner.name,
        termsUrl: partner.termsUrl ?? null,
        disclosureRequired: true,
      };
    }
  }
  return { kind: "official", url: officialUrl, label: "Check live prices on the official site", partnerName: null, termsUrl: null, disclosureRequired: false };
}

// /go redirect resolver — fail-closed (null ⇒ 404).
export function resolveGoTarget(target: string, key: string): { url: string } | null {
  const r = resolveSlot(target, key, "");
  return r.kind === "affiliate" ? { url: r.url } : null;
}

export function goLink(surface: string, key: string, target: string): string {
  const path = `/go/${encodeURIComponent(key)}/${encodeURIComponent(target)}`;
  return surface ? `${path}?s=${encodeURIComponent(surface)}` : path;
}

import { goLink, resolveParkingMerchant } from "../lib/partners";
import type { LeagueEntry } from "../lib/content";

const SURFACE = "hub";

/** One tracked pre-book link per airport, resolved off the live affiliate config. Built here (not in
 *  the component body) so the whole section can fail closed: if nothing resolves we render nothing.
 *  Each airport resolves to its configured merchant (APH on its override airports, Holiday Extras
 *  elsewhere); we carry the merchant name through so the disclosure names exactly who is used. */
function resolveHubLinks(
  league: LeagueEntry[],
): { slug: string; name: string; href: string; merchant: string }[] {
  return league
    // Pre-booking a car park is only an honest CTA where there's a forecourt charge to avoid.
    .filter((e) => !e.isFree)
    .map((e) => {
      // resolveParkingMerchant returns null when no active merchant has a live link for the slug —
      // that null IS the fail-closed gate. No live link → no CTA for that airport.
      const m = resolveParkingMerchant(e.airportSlug, SURFACE);
      if (!m) return null;
      return { slug: e.airportSlug, name: e.name, href: goLink(SURFACE, e.airportSlug, "parking"), merchant: m.partnerName };
    })
    .filter((r): r is { slug: string; name: string; href: string; merchant: string } => r !== null);
}

/**
 * Hub-level affiliate CTA. The comparison hub carried no booking CTA at all; this adds a tracked
 * "pre-book parking & skip the gate" link per charging airport, routed through the first-party `/go`
 * redirect (surface="hub") so every click is recorded and the AWIN deep link stays byte-identical.
 *
 * Fail-closed by construction: each link only renders if `resolveHeProduct` returns a live target,
 * and the whole section returns null when none do — never a broken or hardcoded merchant link.
 * Visually subordinate to the data table, carries the ASA "Ad" label and the neutrality line so the
 * neutral-referee moat is protected.
 */
export function HubBookingCta({ league }: { league: LeagueEntry[] }) {
  const links = resolveHubLinks(league);
  if (links.length === 0) return null; // graceful absence — no live affiliate link anywhere
  // Name the actual merchants used (could be a mix of Holiday Extras + APH across airports).
  const merchants = Array.from(new Set(links.map((l) => l.merchant)));
  const merchantList =
    merchants.length === 1
      ? merchants[0]
      : `${merchants.slice(0, -1).join(", ")} or ${merchants[merchants.length - 1]}`;

  return (
    <section
      aria-label="Pre-book airport parking"
      className="space-y-3 rounded-card border border-brand-accent/30 bg-blue-50 dark:bg-brand-accent/[0.08] dark:border-brand-accent/20 p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-ink">Pre-book parking &amp; skip the gate price</h2>
        <span className="rounded border border-ink-muted/40 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
          Ad
        </span>
      </div>
      <p className="text-sm text-ink-muted">
        Dropping off costs more the longer you stop. If you&apos;re actually parking for the trip, pre-booking
        beats the drive-up gate price — free cancellation, no code. Pick your airport:
      </p>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink">
        <li>✓ Free cancellation</li>
        <li>✓ No code needed</li>
        <li>✓ Best Price Guaranteed</li>
      </ul>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
        {links.map((l) => (
          <li key={l.slug}>
            <a
              href={l.href}
              rel="sponsored noopener noreferrer"
              target="_blank"
              className="inline-flex min-h-[44px] items-center gap-1 font-medium text-brand-accent underline-offset-4 hover:underline"
            >
              Pre-book {l.name} <span aria-hidden="true">↗</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="text-xs text-ink-muted">
        Affiliate links (Ad) — if you book through {merchantList}, ParkMath earns a commission, at no cost to
        you. It never affects our ranking or which airport we show as cheapest.
      </p>
    </section>
  );
}

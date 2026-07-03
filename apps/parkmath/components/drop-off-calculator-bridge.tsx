import { dropOffCalculatorBridge, dropOffCalculatorBridgeLine } from "../lib/parking-vs-drop-off-content";

/** Compact, above-the-fold teaser CTA on `/drop-off-charges/[airport]` — "One drop-off costs £X — N
 *  days of parking from £Y. Compare →". Positioned right after the page's primary answer stat, ahead
 *  of the fuller `DropOffParkingBridge` Callout lower down (that one stays untouched; this is additive).
 *
 *  FAIL-CLOSED (2026-07-03 parking sprint, tranche 2 item 7): `dropOffCalculatorBridge` already checks
 *  a real drop-off fee, a verified parking price for the reference duration, AND a live resolving
 *  affiliate link before setting `show`. Renders nothing for a free-drop-off airport, an airport with
 *  no parking tariff, or one with no active affiliate merchant — never an invented price or dead link. */
export function DropOffCalculatorBridge({ slug }: { slug: string }) {
  const bridge = dropOffCalculatorBridge(slug);
  const line = dropOffCalculatorBridgeLine(bridge);
  if (!bridge.show || !line) return null;

  return (
    <p className="mf-edge flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 rounded-card border border-brand-accent/25 bg-brand-accent/[0.05] px-4 py-2.5 text-sm">
      <span className="text-ink">{line}</span>
      <a
        href={bridge.ctaHref}
        rel="sponsored nofollow"
        className="shrink-0 font-semibold text-brand-accent underline underline-offset-4 hover:opacity-80"
      >
        Compare →
      </a>
    </p>
  );
}

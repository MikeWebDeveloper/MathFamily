import Link from "next/link";
import { formatPence } from "@mathfamily/engine";
import { Callout } from "@mathfamily/ui";
import { dropOffParkingBridge, parkingCompareCta } from "../lib/parking-vs-drop-off-content";

/** Decision bridge for `/drop-off-charges/[airport]` pages.
 *
 *  The page leads with the FREE alternative (the trust + ranking asset) — that stays. This module
 *  is the body-level, decision-framed callout for the ~half of visitors who are actually deciding
 *  HOW to access the airport (park vs drop off). A person researching the drop-off fee is, by
 *  definition, a person choosing how to get to the airport = a parking buyer at the decision point.
 *
 *  Pure server component, JS-off friendly (plain links, no client state). Every number is the
 *  verified drive-up gate price from the dataset — never fabricated. Three honest tiers:
 *   - hasComparison → carry the concrete "park N days = £X vs one £Y drop-off" figure, link to the
 *     `/parking-vs-drop-off/[airport]` decision page.
 *   - hasParking    → onward link to `/airport-parking/[airport]` (no fabricated figure).
 *   - affiliateOnly → no tariff yet, but the airport charges to drop off and an affiliate parking
 *     link resolves → a parking-decision CTA so the drop-off audience is funnelled onward instead of
 *     dead-ending. No price shown. It goes to the airport's options page (a real comparison of every
 *     merchant); only when a single merchant serves the airport does it go straight to that merchant's
 *     tracked `/go/[airport]/parking` redirect, labelled with the merchant's name.
 *  When there's nothing honest to send a parker to, renders nothing.
 *
 *  Wording (2026-11-02): the tariff in tier 1 is the airport's official drive-up GATE rate — the
 *  dataset holds no pre-book price for most airports — so it is always named as such, with the honest
 *  "pre-booking online is usually cheaper — compare live prices" rather than implying a floor. */
export function DropOffParkingBridge({ slug, airportName }: { slug: string; airportName: string }) {
  const bridge = dropOffParkingBridge(slug);
  if (!bridge.show) return null;

  const comparisonHref = `/parking-vs-drop-off/${slug}`;
  const parkingHref = `/airport-parking/${slug}`;

  // Tier 1: full, dated comparison figure → the decision page.
  if (bridge.hasComparison && bridge.parkingPence !== null && bridge.dropOffFeePence !== null) {
    return (
      <Callout variant="info" title={`Cheaper to park or drop off at ${airportName}?`}>
        <p>
          A quick drop-off is the cheapest way in. But if you&apos;re leaving the car, the
          drive-up gate rate at {airportName} is{" "}
          <strong className="mf-num text-ink">{formatPence(bridge.parkingPence)}</strong> for{" "}
          {bridge.parkingDays} days — versus a single{" "}
          <strong className="mf-num text-ink">{formatPence(bridge.dropOffFeePence)}</strong> drop-off.
          Pre-booking online is usually cheaper than the gate rate, so compare live prices before you go.
        </p>
        <p className="mt-3 flex flex-col gap-2">
          <Link
            href={comparisonHref}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-1 rounded-card bg-brand-accent px-4 py-2 text-sm font-semibold text-white sm:w-auto"
          >
            Compare parking vs drop-off at {airportName} →
          </Link>
          <Link href={parkingHref} className="font-medium text-accent-strong underline underline-offset-4">
            Compare all {airportName} parking options →
          </Link>
        </p>
      </Callout>
    );
  }

  // Tier 3: no parking page yet, but the airport charges to drop off and a merchant resolves — a
  // decision CTA to the options page (a real comparison), no fabricated price.
  if (bridge.affiliateOnly) {
    const cta = parkingCompareCta(slug, "dropoff");
    if (!cta) return null;
    const ctaClass =
      "inline-flex min-h-[44px] w-full items-center justify-center gap-1 rounded-card bg-brand-accent px-4 py-2 text-sm font-semibold text-white sm:w-auto";
    return (
      <Callout variant="info" title={`Cheaper to park or drop off at ${airportName}?`}>
        <p>
          A quick drop-off is the cheapest way in. But if you&apos;re leaving the car for the trip,
          it&apos;s worth comparing what parking costs at {airportName} — pre-booking online is usually
          cheaper than paying at the drive-up gate.
        </p>
        <p className="mt-3">
          {cta.kind === "compare" ? (
            <Link href={cta.href} className={ctaClass}>
              Compare {airportName} parking prices →
            </Link>
          ) : (
            <a href={cta.href} rel="sponsored nofollow" className={ctaClass}>
              {cta.label}
            </a>
          )}
        </p>
      </Callout>
    );
  }

  // Tier 2: a parking page exists (e.g. free drop-off + parking tariff) — onward link, no figure.
  return (
    <Callout variant="info" title={`Parking for the trip at ${airportName}?`}>
      <p>
        A quick drop-off is the cheapest way in. But if you&apos;re leaving the car for the trip,
        it&apos;s worth checking what parking costs — pre-booking is usually cheaper than paying at
        the drive-up gate.
      </p>
      <p className="mt-3">
        <Link
          href={parkingHref}
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-1 rounded-card bg-brand-accent px-4 py-2 text-sm font-semibold text-white sm:w-auto"
        >
          Compare {airportName} parking prices →
        </Link>
      </p>
    </Callout>
  );
}

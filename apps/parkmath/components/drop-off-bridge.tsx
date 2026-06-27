import Link from "next/link";
import { formatPence } from "@mathfamily/engine";
import { Callout } from "@mathfamily/ui";
import { dropOffParkingBridge } from "../lib/parking-vs-drop-off-content";
import { goLink } from "../lib/partners";

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
 *     link resolves → a parking-decision CTA straight to the tracked `/go/[airport]/parking` redirect,
 *     so the drop-off audience is funnelled onward instead of dead-ending. No price shown.
 *  When there's nothing honest to send a parker to, renders nothing. */
export function DropOffParkingBridge({ slug, airportName }: { slug: string; airportName: string }) {
  const bridge = dropOffParkingBridge(slug);
  if (!bridge.show) return null;

  const comparisonHref = `/parking-vs-drop-off/${slug}`;
  const parkingHref = `/airport-parking/${slug}`;
  // Tracked first-party redirect → exact AWIN parking deep link (302), with a first-party click log.
  const goParkingHref = goLink("dropoff", slug, "parking");

  // Tier 1: full, dated comparison figure → the decision page.
  if (bridge.hasComparison && bridge.parkingPence !== null && bridge.dropOffFeePence !== null) {
    return (
      <Callout variant="info" title={`Cheaper to park or drop off at ${airportName}?`}>
        <p>
          A quick drop-off is the cheapest way in. But if you&apos;re leaving the car, drive-up
          parking at {airportName} is{" "}
          <strong className="mf-num text-ink">{formatPence(bridge.parkingPence)}</strong> for{" "}
          {bridge.parkingDays} days — versus a single{" "}
          <strong className="mf-num text-ink">{formatPence(bridge.dropOffFeePence)}</strong> drop-off.
          Pre-booking is usually cheaper than the drive-up gate price.
        </p>
        <p className="mt-3 flex flex-col gap-2">
          <Link
            href={comparisonHref}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-1 rounded-card bg-brand-accent px-4 py-2 text-sm font-semibold text-white sm:w-auto"
          >
            Compare parking vs drop-off at {airportName} →
          </Link>
          <Link href={parkingHref} className="font-medium text-brand-accent underline underline-offset-4">
            Compare all {airportName} parking options →
          </Link>
        </p>
      </Callout>
    );
  }

  // Tier 3: no parking page yet, but the airport charges to drop off and an affiliate link resolves —
  // decision CTA straight to the tracked /go parking redirect (no fabricated price).
  if (bridge.affiliateOnly) {
    return (
      <Callout variant="info" title={`Cheaper to park or drop off at ${airportName}?`}>
        <p>
          A quick drop-off is the cheapest way in. But if you&apos;re leaving the car for the trip,
          it&apos;s worth comparing what parking costs at {airportName} — pre-booking is usually
          cheaper than paying at the drive-up gate.
        </p>
        <p className="mt-3">
          <a
            href={goParkingHref}
            rel="sponsored nofollow"
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-1 rounded-card bg-brand-accent px-4 py-2 text-sm font-semibold text-white sm:w-auto"
          >
            Compare {airportName} parking prices →
          </a>
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
          See {airportName} parking — gate vs pre-book →
        </Link>
      </p>
    </Callout>
  );
}

import Link from "next/link";
import { formatPence } from "@mathfamily/engine";
import { Callout } from "@mathfamily/ui";
import { dropOffParkingBridge } from "../lib/parking-vs-drop-off-content";

/** Decision bridge for `/drop-off-charges/[airport]` pages.
 *
 *  The page leads with the FREE alternative (the trust + ranking asset) — that stays. This module
 *  is ADDED below it for the ~half of visitors who will actually PARK: an honest, in-flow link to
 *  the parking decision. Dropping off is cheapest; but if you're parking for the trip, here's what
 *  it costs and where to compare gate vs pre-book.
 *
 *  Pure server component, JS-off friendly (plain links, no client state). Every number is the
 *  verified drive-up gate price from the dataset — never fabricated. When the airport has a
 *  parking-vs-drop-off comparison page it carries the concrete "park N days = £X" figure and links
 *  there; when only a plain parking page exists it degrades to an onward link with no figure; when
 *  there's nothing to compare it renders nothing. */
export function DropOffParkingBridge({ slug, airportName }: { slug: string; airportName: string }) {
  const bridge = dropOffParkingBridge(slug);
  if (!bridge.show) return null;

  const comparisonHref = `/parking-vs-drop-off/${slug}`;
  const parkingHref = `/airport-parking/${slug}`;

  return (
    <Callout variant="info" title="Not just dropping off — parking for the trip?">
      {bridge.hasComparison && bridge.parkingPence !== null && bridge.dropOffFeePence !== null ? (
        <>
          <p>
            A quick drop-off is the cheapest way in. But if you&apos;re leaving the car, drive-up
            parking at {airportName} is{" "}
            <strong className="mf-num text-ink">{formatPence(bridge.parkingPence)}</strong> for{" "}
            {bridge.parkingDays} days — versus a single{" "}
            <strong className="mf-num text-ink">{formatPence(bridge.dropOffFeePence)}</strong> drop-off.
            Pre-booking is usually cheaper than the drive-up gate price.
          </p>
          <p className="mt-2 flex flex-col gap-1">
            <Link href={comparisonHref} className="font-semibold text-brand-accent underline underline-offset-4">
              Parking for the trip? See gate vs pre-book for {airportName} →
            </Link>
            <Link href={parkingHref} className="font-medium text-brand-accent underline underline-offset-4">
              Compare all {airportName} parking options →
            </Link>
          </p>
        </>
      ) : (
        <>
          <p>
            A quick drop-off is the cheapest way in. But if you&apos;re leaving the car for the trip,
            it&apos;s worth checking what parking costs — pre-booking is usually cheaper than paying
            at the drive-up gate.
          </p>
          <p className="mt-2">
            <Link href={parkingHref} className="font-semibold text-brand-accent underline underline-offset-4">
              See {airportName} parking — gate vs pre-book →
            </Link>
          </p>
        </>
      )}
    </Callout>
  );
}

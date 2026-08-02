import { goLinkMerchant, type PartnerOffer } from "../lib/partners";

/** One merchant option in the parking booking block, redesigned 2026-08-01 to fix the mobile ad-block
 *  audit: distinct card per merchant (border + surface, never a bare row), a real per-merchant hook/
 *  value-point pulled from `partner.offer` (sourced, verbatim — see partners.json), and a ≥44px CTA.
 *  Shared by `BookingOptions` (options-page card list) and `HolidayExtrasCard`'s parking variant
 *  (the drop-off / parking-vs-drop-off "wall of buttons" — the worst offender in the audit), so both
 *  surfaces render the same honest, differentiated card instead of two divergent treatments.
 *
 *  `featured` marks the airport's pinned official-operator option (e.g. Heathrow Airport Parking at
 *  Heathrow) — the one deliberate visual accent point; every other card stays equal-weight, matching
 *  the commission-blind alphabetical ordering `resolveAllParkingMerchants` already guarantees. */
export function MerchantCard({
  partnerId,
  partnerName,
  termsUrl,
  officialUrl,
  offer,
  featured,
  airportSlug,
  surface,
}: {
  partnerId: string;
  partnerName: string;
  termsUrl: string | null;
  officialUrl: string;
  offer: PartnerOffer | null;
  featured: boolean;
  airportSlug: string;
  surface: string;
}) {
  const fallbackPoints = [
    `Compare on-airport, Park & Ride and Meet & Greet at ${partnerName}`,
    "Free cancellation, no code needed",
  ];
  const points = offer?.points?.length ? offer.points.slice(0, 2) : fallbackPoints;

  return (
    <li
      className={`rounded-card border p-4 ${
        featured
          ? "border-brand-accent/50 bg-white shadow-sm dark:bg-brand-accent/[0.05]"
          : "border-ink/10 bg-card"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="font-semibold text-ink">{partnerName}</p>
            {featured ? (
              <span className="rounded-full bg-brand-accent px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                Featured
              </span>
            ) : offer?.badge ? (
              <span className="rounded-full border border-ink/15 px-2 py-0.5 text-[11px] font-medium text-ink-muted">
                {offer.badge}
              </span>
            ) : null}
          </div>

          {offer?.hook ? (
            <span className="inline-block rounded-full bg-positive/10 px-2.5 py-1 text-xs font-semibold text-positive">
              {offer.hook}
            </span>
          ) : null}

          <ul className="space-y-0.5 text-sm text-ink-muted">
            {points.map((p) => (
              <li key={p}>✓ {p}</li>
            ))}
          </ul>

          <a
            href={termsUrl ?? officialUrl}
            rel="noopener noreferrer"
            target="_blank"
            className="inline-flex min-h-[44px] items-center text-xs text-ink-muted underline underline-offset-4 sm:min-h-0"
          >
            Terms ↗
          </a>
        </div>

        <a
          href={goLinkMerchant(surface, airportSlug, partnerId)}
          rel="sponsored noopener noreferrer"
          target="_blank"
          className="inline-flex min-h-[44px] w-full shrink-0 items-center justify-center rounded-card bg-brand-accent px-4 text-center text-sm font-semibold text-white sm:w-auto sm:whitespace-nowrap"
        >
          Book parking with {partnerName} ↗
        </a>
      </div>
    </li>
  );
}

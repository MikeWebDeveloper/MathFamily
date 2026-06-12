import { resolveSlot, type SlotId } from "../lib/partners";

const PARKING_SLOT: SlotId = "parking-prebook";

export function BookingOptions({ airportName, airportSlug, officialUrl }: { airportName: string; airportSlug: string; officialUrl: string }) {
  const he = resolveSlot(PARKING_SLOT, airportSlug, officialUrl);
  const hasAffiliate = he.kind === "affiliate";
  return (
    <section aria-label="Your booking options" className="space-y-4 rounded-card border border-ink/10 bg-surface p-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-ink">Your booking options</h2>
        <p className="text-sm text-ink-muted">
          Our ranking above uses only the airport&apos;s own published prices — it isn&apos;t affected by commission.
        </p>
      </div>

      <div className="rounded-card border border-ink/10 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-ink">Book direct with the airport</h3>
          <span className="rounded border border-ink-muted/40 px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-ink-muted">Official site</span>
        </div>
        <p className="mt-1 text-sm text-ink-muted">{airportName} official car parks.</p>
        <a
          href={officialUrl}
          rel="noopener noreferrer"
          target="_blank"
          className="mt-3 inline-block rounded-card border border-brand-accent px-4 py-2 text-sm font-semibold text-brand-accent"
        >
          Go to airport site ▸
        </a>
      </div>

      {hasAffiliate ? (
        <div className="rounded-card border border-brand-accent/30 bg-blue-50 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-ink">Pre-book &amp; save with {he.partnerName}</h3>
            <span className="rounded border border-ink-muted/40 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Ad</span>
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink">
            <li>✓ Free cancellation (cancel to arrival)</li>
            <li>✓ No code needed</li>
            <li>✓ Best Price Guaranteed</li>
          </ul>
          <p className="mt-2 text-sm text-ink-muted">
            10% off most Holiday Extras car parks — up to 25% at Gatwick (Meet &amp; Greet North). Discount applied
            automatically, no code.{" "}
            <a href="https://www.holidayextras.com/airport-parking.html" rel="noopener noreferrer" target="_blank" className="underline underline-offset-4">
              Terms ↗
            </a>
          </p>
          <a
            href={he.url}
            rel="sponsored noopener noreferrer"
            target="_blank"
            className="mt-3 inline-block rounded-card bg-brand-accent px-4 py-2 text-sm font-semibold text-white"
          >
            Book my parking — free cancellation ↗
          </a>
        </div>
      ) : null}

      {hasAffiliate ? (
        <p className="text-xs text-ink-muted">
          We earn a commission only if you book the &ldquo;Ad&rdquo; option — it never changes our ranking or which park
          we show as cheapest.
        </p>
      ) : null}
    </section>
  );
}

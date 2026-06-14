import { resolveHeProduct, type HeProduct } from "../lib/partners";

const TERMS_URL = "https://www.holidayextras.com/airport-parking.html";

function discountLine(product: HeProduct): string {
  if (product === "lounge") return "10% off airport lounges, applied automatically.";
  return "10% off most Holiday Extras car parks — up to 25% at Gatwick (Meet & Greet North). Applied automatically, no code.";
}

export function HolidayExtrasCard({ product, airportName, airportSlug, surface, extras }: {
  product: HeProduct;
  airportName: string;
  airportSlug: string;
  surface: string;
  extras?: HeProduct[];
}) {
  const primary = resolveHeProduct(product, airportSlug, surface);
  if (!primary) return null;
  const extraLinks = (extras ?? [])
    .map((p) => resolveHeProduct(p, airportSlug, `${surface}-${p}`))
    .filter((r): r is { url: string; productLabel: string } => r !== null);

  return (
    <section aria-label={`Pre-book ${primary.productLabel} with Holiday Extras`} className="rounded-card border border-brand-accent/30 bg-blue-50 dark:bg-brand-accent/[0.08] dark:border-brand-accent/20 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="rounded border border-ink-muted/40 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Ad</span>
        <span className="text-xs text-ink-muted">Holiday Extras</span>
      </div>

      <a
        href={primary.url}
        rel="sponsored noopener noreferrer"
        target="_blank"
        className="flex min-h-[44px] items-center justify-between gap-3 font-semibold text-brand-accent sm:hidden"
      >
        <span>Pre-book {airportName} {primary.productLabel} — 10% off, free cancellation</span>
        <span aria-hidden="true">↗</span>
      </a>

      <div className="hidden sm:block">
        <h3 className="font-semibold text-ink">Pre-book {airportName} {primary.productLabel}</h3>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink">
          <li>✓ Free cancellation</li>
          <li>✓ 10% off, applied automatically</li>
          <li>✓ Best Price Guaranteed</li>
        </ul>
        <p className="mt-2 text-sm text-ink-muted">
          {discountLine(product)}{" "}
          <a href={TERMS_URL} rel="noopener noreferrer" target="_blank" className="underline underline-offset-4">Terms ↗</a>
        </p>
        <a
          href={primary.url}
          rel="sponsored noopener noreferrer"
          target="_blank"
          className="mt-3 inline-block rounded-card bg-brand-accent px-4 py-2 text-sm font-semibold text-white"
        >
          Book {primary.productLabel} — free cancellation ↗
        </a>
      </div>

      {extraLinks.length > 0 ? (
        <p className="mt-3 text-xs text-ink-muted">
          Also from Holiday Extras:{" "}
          {extraLinks.map((r, i) => (
            <span key={r.productLabel}>
              {i > 0 ? " · " : ""}
              <a href={r.url} rel="sponsored noopener noreferrer" target="_blank" className="underline underline-offset-4">
                airport {r.productLabel}s
              </a>
            </span>
          ))}
        </p>
      ) : null}

      <p className="mt-2 text-xs text-ink-muted">
        Affiliate links (Ad) — if you book through Holiday Extras, ParkMath earns a commission, at no cost to you. It
        never affects which option we show as cheapest.
      </p>
    </section>
  );
}

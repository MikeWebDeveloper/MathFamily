/**
 * WidgetLayout — a stripped, self-contained card shell for iframe contexts.
 *
 * Design decisions:
 * - No Tailwind: all styles are inline or a single <style> tag that ships with
 *   the server-rendered HTML. This keeps the total document tiny (~1 KB CSS)
 *   and fully portable across every app that might embed it later.
 * - IBM Plex Sans is loaded lazily from Google Fonts only when JS loads the
 *   component outside an iframe. In iframe usage the host is a separate HTML
 *   doc and we inject the @font-face ourselves (see widget-layout-css.ts).
 * - Token variables reference the host-page tokens when inside a MathFamily
 *   app; they fall back to the hard-coded fallbacks below in every other host.
 * - prefers-reduced-motion: no animation anywhere in this component.
 * - WCAG AA: text contrast is enforced via the fallback colours (navy on white,
 *   muted on white both exceed 4.5:1).
 *
 * Usage:
 *   <WidgetLayout title="…" verifiedAt="2026-06-01" attributionUrl="…">
 *     {children}
 *   </WidgetLayout>
 */

export interface WidgetLayoutProps {
  /** Short headline shown at the top of the card (e.g. "UK airport drop-off fees"). */
  title: string;
  /** ISO date string — rendered as "Verified 10 Jun 2026". */
  verifiedAt: string;
  /** Full URL for the "Source: ParkMath.co.uk" attribution link. */
  attributionUrl: string;
  /** Brand name, default "ParkMath". */
  brandName?: string;
  /** Optional aria-label for the outer landmark (defaults to title). */
  ariaLabel?: string;
  children: React.ReactNode;
}

function fmtDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  });
}

/**
 * The shared WidgetLayout — server-renderable, no Tailwind dependency.
 * Ships with its own minimal inline CSS so it looks correct in any host page
 * or iframe without needing the MathFamily design token layer.
 *
 * Target size with children: < 5 KB HTML, no JS hydration required.
 */
export function WidgetLayout({
  title,
  verifiedAt,
  attributionUrl,
  brandName = "ParkMath",
  ariaLabel,
  children
}: WidgetLayoutProps) {
  const formatted = fmtDate(verifiedAt);

  return (
    <section
      aria-label={ariaLabel ?? title}
      style={{
        fontFamily:
          'var(--font-sans, "IBM Plex Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif)',
        background: "var(--color-card, #ffffff)",
        color: "var(--color-ink, #0f172a)",
        borderRadius: "var(--radius-card, 0.75rem)",
        boxShadow: "var(--shadow-card, 0 1px 2px rgb(15 23 42 / 0.06), 0 8px 24px -6px rgb(15 23 42 / 0.08))",
        border: "1px solid rgb(15 23 42 / 0.07)",
        overflow: "hidden",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale"
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: "8px",
          flexWrap: "wrap",
          padding: "12px 16px 0"
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "-0.01em",
            color: "var(--color-ink, #0f172a)",
            lineHeight: 1.3
          }}
        >
          {title}
        </h2>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "10px",
            fontWeight: 600,
            color: "var(--color-positive, #16a34a)",
            background: "rgb(22 163 74 / 0.09)",
            border: "1px solid rgb(22 163 74 / 0.18)",
            borderRadius: "999px",
            padding: "1px 7px",
            whiteSpace: "nowrap"
          }}
          aria-label={`Data verified ${formatted}`}
        >
          {/* Inline check glyph — no icon library dependency */}
          <svg
            aria-hidden
            viewBox="0 0 10 10"
            width="9"
            height="9"
            fill="none"
            style={{ display: "block", flexShrink: 0 }}
          >
            <path
              d="M2 5.5 4.2 7.5 8 3"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Verified {formatted}</span>
        </span>
      </div>

      {/* Content slot */}
      <div style={{ padding: "12px 16px" }}>{children}</div>

      {/* Attribution footer — always present, never optional */}
      <div
        style={{
          padding: "8px 16px",
          borderTop: "1px solid rgb(15 23 42 / 0.07)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          flexWrap: "wrap"
        }}
      >
        <span
          style={{
            fontSize: "10px",
            color: "var(--color-ink-muted, #475569)",
            lineHeight: 1.4
          }}
        >
          Source:{" "}
          <a
            href={attributionUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--color-brand-accent, #2563eb)",
              fontWeight: 600,
              textDecoration: "none"
            }}
          >
            {brandName}
          </a>
          {" — verified UK airport fees"}
        </span>
        <a
          href={attributionUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Visit ${brandName} for full data`}
          style={{
            fontSize: "10px",
            fontWeight: 600,
            color: "var(--color-brand-accent, #2563eb)",
            textDecoration: "none",
            whiteSpace: "nowrap"
          }}
        >
          parkmath.co.uk →
        </a>
      </div>
    </section>
  );
}

/** Per-figure freshness stamp: "✓ 10 Jun 2026" → tap reveals the official source. */
export function VerifiedStamp({
  verifiedAt,
  sourceUrl,
  sourceLabel
}: {
  verifiedAt: string;
  sourceUrl: string;
  sourceLabel: string;
}) {
  const formatted = new Date(`${verifiedAt}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC"
  });
  return (
    <details className="relative inline-block align-middle">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-semibold text-positive transition-colors hover:bg-positive/10 [&::-webkit-details-marker]:hidden">
        <span aria-hidden>✓</span> {formatted}
      </summary>
      <div className="absolute left-0 z-30 mt-1.5 w-60 rounded-lg border border-ink/10 bg-white p-3 text-left shadow-lg">
        <p className="text-xs text-ink-muted">Verified against:</p>
        <a href={sourceUrl} rel="noopener" className="mt-1 block break-words text-xs font-medium text-brand-accent underline underline-offset-2">
          {sourceLabel}
        </a>
      </div>
    </details>
  );
}

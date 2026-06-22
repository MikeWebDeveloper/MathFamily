/**
 * ChapterDivider — lightweight editorial section separator.
 *
 * A hairline rule + optional label, pure CSS, zero JS.  Used between
 * "chapters" on answer/spoke pages to create reading rhythm without adding
 * visual noise.  Works in both light and dark mode via semantic tokens.
 *
 * Usage:
 *   <ChapterDivider label="Free alternative" />
 *   <ChapterDivider />   (hairline only, no label)
 *
 * SSR-safe: no client directive, no effects, no state.  Renders in static HTML.
 */
export function ChapterDivider({ label }: { label?: string }) {
  if (!label) {
    return (
      <hr
        aria-hidden
        className="border-0 border-t border-surface-muted my-2"
        style={{ borderColor: "color-mix(in srgb, var(--color-ink) 10%, transparent)" }}
      />
    );
  }

  return (
    <div
      role="separator"
      aria-label={label}
      className="flex items-center gap-3 my-2"
    >
      <div
        className="h-px flex-1"
        style={{ background: "color-mix(in srgb, var(--color-ink) 10%, transparent)" }}
        aria-hidden
      />
      <span
        className="text-xs font-semibold uppercase tracking-widest select-none"
        style={{ color: "var(--color-ink-muted)" }}
      >
        {label}
      </span>
      <div
        className="h-px flex-1"
        style={{ background: "color-mix(in srgb, var(--color-ink) 10%, transparent)" }}
        aria-hidden
      />
    </div>
  );
}

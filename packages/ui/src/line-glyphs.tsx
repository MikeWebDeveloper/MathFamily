/** Brand line-art glyph set — decorative accents, never photos. All stroke-based,
 *  currentColor, aria-hidden. Use at low opacity (e.g. className="text-brand/20"). */

export function PlaneGlyph({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M44 24 28 22 16 6h-4l6 16-12 2-4-6H0l4 8-4 8h2l4-6 12 2-6 16h4l12-16 16-2c2 0 2-4 0-4Z" />
    </svg>
  );
}

export function TowerGlyph({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M16 14h16l-2 10h-12l-2-10Zm6 10v18m4-18v18m-10 0h16M14 14l2-6h16l2 6M24 4v4" />
    </svg>
  );
}

export function LuggageGlyph({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="12" y="14" width="24" height="26" rx="4" />
      <path d="M19 14V9a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v5M19 22v10m10-10v10" />
    </svg>
  );
}

export function SimGlyph({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 6h14l8 8v26a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
      <rect x="18" y="22" width="12" height="12" rx="2" />
      <path d="M24 22v12M18 28h12" />
    </svg>
  );
}

/** Runway-dash section divider (ParkMath flavour). */
export function RunwayDivider({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 8" aria-hidden preserveAspectRatio="none" className={className ?? "h-2 w-full text-ink/15"}>
      <line x1="0" y1="4" x2="400" y2="4" stroke="currentColor" strokeWidth="2" strokeDasharray="18 14" />
    </svg>
  );
}

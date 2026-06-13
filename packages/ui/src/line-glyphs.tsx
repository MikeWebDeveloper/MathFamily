/** Brand line-art accents — decorative, never photos. Stroke-based, currentColor,
 *  aria-hidden. Use at low opacity (e.g. className="text-brand/15"). */

/** Runway-dash section divider (ParkMath flavour). */
export function RunwayDivider({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 8" aria-hidden preserveAspectRatio="none" className={className ?? "h-2 w-full text-ink/15"}>
      <line x1="0" y1="4" x2="400" y2="4" stroke="currentColor" strokeWidth="2" strokeDasharray="18 14" />
    </svg>
  );
}

const glyphBase = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function PlaneGlyph({ className }: { className?: string }) {
  return (<svg {...glyphBase} className={className}><path d="M10.5 13.5 3 12l2-3 5 1 5-6a2 2 0 0 1 3 3l-6 5 1 5-3 2-1.5-7.5z" /></svg>);
}
export function TowerGlyph({ className }: { className?: string }) {
  return (<svg {...glyphBase} className={className}><path d="M12 3v4M9 7h6l-1 7H10z" /><path d="M8 21l1.5-7M16 21l-1.5-7M7 21h10" /></svg>);
}
export function LuggageGlyph({ className }: { className?: string }) {
  return (<svg {...glyphBase} className={className}><rect x="6" y="7" width="12" height="13" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M9 20v1M15 20v1" /></svg>);
}
export function GlobeGlyph({ className }: { className?: string }) {
  return (<svg {...glyphBase} className={className}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" /></svg>);
}
export function ChevronGlyph({ className }: { className?: string }) {
  return (<svg {...glyphBase} className={className}><path d="M9 6l6 6-6 6" /></svg>);
}

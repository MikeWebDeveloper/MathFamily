import { COUNTRY_CENTROIDS, COUNTRY_PATHS, WORLD_OUTLINE, WORLD_VIEWBOX } from "./generated/world-paths";

/** Decorative world map with the destination country filled and pulsing. */
export function RegionMap({ iso2, className }: { iso2: string; className?: string }) {
  const country = COUNTRY_PATHS[iso2];
  const centroid = COUNTRY_CENTROIDS[iso2];
  if (!country || !centroid) return null;
  const cx = centroid[0];
  const cy = centroid[1];
  return (
    <svg viewBox={WORLD_VIEWBOX} aria-hidden data-mf-loop className={className}>
      <path d={WORLD_OUTLINE} fill="currentColor" opacity="0.05" />
      <path d={country} fill="var(--color-brand-accent)" opacity="0.25" />
      <g transform={`translate(${cx} ${cy})`}>
        <circle r="12" className="mf-pulse" fill="var(--color-brand-accent)" opacity="0.35" />
        <circle r="4" fill="var(--color-brand-accent)" />
      </g>
    </svg>
  );
}

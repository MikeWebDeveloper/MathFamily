import { UK_PATH, UK_VIEWBOX, ukProject } from "./generated/uk-path";

export type UkMapMarker = { lat: number; lng: number; active?: boolean };

/** Decorative UK outline with airport dots. Active markers get the radar pulse. */
export function UkMap({ markers, className }: { markers: UkMapMarker[]; className?: string }) {
  return (
    <svg viewBox={UK_VIEWBOX} aria-hidden data-mf-loop className={className}>
      <path d={UK_PATH} fill="currentColor" opacity="0.07" />
      {markers.map((m, i) => {
        const [x, y] = ukProject(m.lat, m.lng);
        return (
          <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
            {m.active ? <circle r="7" className="mf-pulse" fill="var(--color-brand-accent)" opacity="0.35" /> : null}
            <circle r={m.active ? 3 : 1.8} fill="var(--color-brand-accent)" opacity={m.active ? 1 : 0.55} />
          </g>
        );
      })}
    </svg>
  );
}

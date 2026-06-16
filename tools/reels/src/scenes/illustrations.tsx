import type { BrandTheme } from "./theme";

// Flat, on-brand SVG scenery (silhouette style, theme colours — no gradients, no stock photos).

/** Persistent airport skyline band anchored to the bottom: terminal, control tower, a parked plane. */
export const Skyline: React.FC<{ theme: BrandTheme }> = ({ theme }) => (
  <svg viewBox="0 0 1080 240" width="100%" height="240" preserveAspectRatio="xMidYMax meet" style={{ position: "absolute", left: 0, bottom: 10 }} aria-hidden="true">
    <rect x="0" y="214" width="1080" height="26" fill={theme.decor} />
    {/* terminal building with a curved roof */}
    <path d="M150 214 V150 Q150 126 184 126 H470 Q504 126 504 150 V214 Z" fill={theme.decor} />
    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
      <rect key={i} x={200 + i * 40} y={162} width={20} height={30} rx={4} fill={theme.accent} opacity={0.55} />
    ))}
    {/* control tower + beacon */}
    <rect x="560" y="96" width="30" height="118" rx="6" fill={theme.decor} />
    <path d="M548 96 H602 L592 72 H558 Z" fill={theme.decor} />
    <circle cx="575" cy="62" r="7" fill={theme.accentBright} />
    {/* parked plane (top-down) on the apron */}
    <g transform="translate(648 150)" fill={theme.decor}>
      <rect x="0" y="40" width="190" height="16" rx="8" />
      <path d="M70 48 L42 16 L98 44 Z" />
      <path d="M70 48 L42 80 L98 52 Z" />
      <path d="M178 48 L196 34 L188 48 Z" />
    </g>
  </svg>
);

/** Parking barrier whose arm lifts. liftDeg: 0 = closed (horizontal), negative = raised. */
export const Barrier: React.FC<{ theme: BrandTheme; liftDeg: number }> = ({ theme, liftDeg }) => (
  <svg viewBox="0 0 380 210" width="380" height="210" aria-hidden="true">
    <rect x="22" y="190" width="74" height="14" rx="6" fill="#fff" />
    <rect x="42" y="64" width="32" height="128" rx="8" fill="#fff" />
    <circle cx="58" cy="74" r="7" fill={theme.bg} />
    <g transform={`rotate(${liftDeg} 58 74)`}>
      <rect x="58" y="65" width="296" height="18" rx="9" fill="#fff" />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={74 + i * 56} y="65" width="28" height="18" fill={theme.warn} />
      ))}
    </g>
  </svg>
);

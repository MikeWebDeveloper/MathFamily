/** Tiny inline price-trend sparkline (mono-data accent). Colours itself by
 *  direction: rising = warning amber, falling = positive green, flat = muted.
 *  Decorative — always pair it with a TrendChip or the actual figure.
 *
 *  Feed it a real series only: on ParkMath the honest source is
 *  [priorYearFeePence, currentFeePence]. Never synthesise points — a price
 *  tracker that invents a curve is no longer verifiable. */
export function Sparkline({
  data,
  width = 72,
  height = 24,
  strokeWidth = 2,
  color,
  className
}: {
  data: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
}) {
  if (!data || data.length < 2) return null;
  const first = data[0]!;
  const last = data[data.length - 1]!;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const rng = max - min || 1;
  const up = last > first;
  const flat = last === first;
  const auto = flat ? "var(--color-ink-muted)" : up ? "var(--color-warning)" : "var(--color-positive)";
  const stroke = color ?? auto;
  const y = (v: number) => height - 2 - ((v - min) / rng) * (height - 4);
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${y(v)}`).join(" ");
  return (
    <svg width={width} height={height} aria-hidden className={className} style={{ display: "block", overflow: "visible" }}>
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={flat ? 0.45 : 1}
      />
      {!flat ? <circle cx={width} cy={y(last)} r="2.5" fill={stroke} /> : null}
    </svg>
  );
}

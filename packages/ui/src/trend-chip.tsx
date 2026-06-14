/** Direction delta chip for a price series: "↑ +£1" amber when rising,
 *  "↓ −£1" green when falling (a fall is good news for the reader), "Held"
 *  muted when unchanged. Pairs with a Sparkline.
 *
 *  Takes a real series — on ParkMath that is [priorYearFeePence, currentFee].
 *  `baseLabel` adds the comparison period, e.g. "vs 2025". */
export function TrendChip({
  data,
  unit = "£",
  baseLabel
}: {
  data: number[];
  unit?: string;
  baseLabel?: string;
}) {
  if (!data || data.length < 2) return null;
  const delta = data[data.length - 1]! - data[0]!;
  if (delta === 0) {
    return (
      <span className="text-[11px] font-semibold text-ink-muted">
        Held{baseLabel ? ` ${baseLabel}` : ""}
      </span>
    );
  }
  const up = delta > 0;
  const mag = Math.abs(delta / 100);
  const magText = mag.toFixed(mag % 1 ? 2 : 0);
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
        up ? "bg-warning/10 text-warning" : "bg-positive/10 text-positive"
      }`}
    >
      <span aria-hidden>{up ? "↑" : "↓"}</span>
      {up ? "+" : "−"}
      {unit}
      {magText}
      {baseLabel ? <span className="ml-0.5 font-medium text-ink-muted">{baseLabel}</span> : null}
    </span>
  );
}

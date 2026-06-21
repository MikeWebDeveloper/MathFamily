/** Compact stat strip: one navy card, N stats split by hairline dividers. Replaces a row of full FeeStats.
 *  Mobile: 2 stats → 2-up, 3 → stacked, 4 → 2×2 grid; full labels/values wrap (never truncated).
 *  sm+: a single row (2/3/4 columns) with vertical hairline dividers. */
export function StatStrip({ stats }: { stats: { label: string; value: string; note?: string }[] }) {
  // Desktop (sm+): one row. Mobile: 2-up for even counts (2×2 when 4), single column for 3.
  const smCols = stats.length <= 2 ? "sm:grid-cols-2" : stats.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-4";
  const baseCols = stats.length === 3 ? "grid-cols-1" : "grid-cols-2";
  return (
    <div
      className="mf-fade-in relative overflow-hidden rounded-card bg-brand text-white ring-1 ring-white/10"
      style={{ boxShadow: "var(--shadow-hero)" }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white/12 to-transparent" />
      {/* Mobile divides on both axes (2×2 grid cells); sm+ collapses to a single row with vertical dividers only. */}
      <dl className={`grid ${baseCols} ${smCols} divide-x divide-y divide-white/10 sm:divide-y-0`}>
        {stats.map((s) => (
          <div key={s.label} className="min-w-0 px-3 py-4 sm:px-5">
            <dt className="text-[11px] font-semibold uppercase leading-tight tracking-wider text-white/65">{s.label}</dt>
            <dd className="mf-num mt-1 text-2xl font-bold leading-none sm:text-3xl">{s.value}</dd>
            {s.note ? <p className="mt-1 text-xs leading-snug text-white/70">{s.note}</p> : null}
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Compact stat strip: one navy card, N stats split by hairline dividers. Replaces a row of full FeeStats. */
export function StatStrip({ stats }: { stats: { label: string; value: string; note?: string }[] }) {
  const cols = stats.length <= 2 ? "grid-cols-2" : stats.length === 3 ? "grid-cols-3" : "grid-cols-4";
  return (
    <div
      className="mf-fade-in relative overflow-hidden rounded-card bg-brand text-white ring-1 ring-white/10"
      style={{ boxShadow: "var(--shadow-hero)" }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white/12 to-transparent" />
      <dl className={`grid ${cols} divide-x divide-white/10`}>
        {stats.map((s) => (
          <div key={s.label} className="min-w-0 px-3 py-4 sm:px-5">
            <dt className="truncate text-[11px] font-semibold uppercase tracking-wider text-white/65">{s.label}</dt>
            <dd className="mf-num mt-1 text-2xl font-bold leading-none sm:text-3xl">{s.value}</dd>
            {s.note ? <p className="mt-1 truncate text-xs text-white/70">{s.note}</p> : null}
          </div>
        ))}
      </dl>
    </div>
  );
}

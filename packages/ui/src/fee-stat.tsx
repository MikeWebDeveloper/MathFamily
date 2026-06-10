export function FeeStat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div
      className="mf-fade-in relative overflow-hidden rounded-card bg-brand p-6 text-white ring-1 ring-white/10"
      style={{ boxShadow: "var(--shadow-hero)" }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/20" />
      <p className="text-xs font-semibold uppercase tracking-wider text-white/65">{label}</p>
      <p className="mf-num mt-2 text-5xl font-bold leading-none text-white">{value}</p>
      {note ? <p className="mt-3 text-sm text-white/75">{note}</p> : null}
    </div>
  );
}

export function FeeStat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-card bg-brand p-6 text-white">
      <p className="text-sm font-medium uppercase tracking-wide text-white/70">{label}</p>
      <p className="mt-1 text-5xl font-bold tabular-nums">{value}</p>
      {note ? <p className="mt-2 text-sm text-white/80">{note}</p> : null}
    </div>
  );
}

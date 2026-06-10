export function FreshnessBadge({
  verifiedAt,
  // keep in sync with STALE_AFTER_DAYS in @mathfamily/engine
  staleAfterDays = 60,
  now = new Date()
}: {
  verifiedAt: string;
  staleAfterDays?: number;
  now?: Date;
}) {
  const date = new Date(`${verifiedAt}T00:00:00Z`);
  const ageDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  const stale = ageDays > staleAfterDays;
  const formatted = date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  return (
    <span
      className={
        stale
          ? "mf-fade-in inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-warning ring-1 ring-warning/20"
          : "mf-fade-in inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-positive ring-1 ring-positive/20"
      }
    >
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${stale ? "bg-warning" : "bg-positive"}`} />
      {stale ? `Last verified ${formatted}` : `Verified ${formatted}`}
    </span>
  );
}

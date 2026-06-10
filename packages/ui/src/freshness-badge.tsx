export function FreshnessBadge({
  verifiedAt,
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
          ? "inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-warning"
          : "inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-positive"
      }
    >
      {stale ? `Last verified ${formatted}` : `Verified ${formatted}`}
    </span>
  );
}

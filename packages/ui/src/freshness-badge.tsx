import { CheckTick } from "./check-tick";

function fmtDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function FreshnessBadge({
  verifiedAt,
  // keep in sync with STALE_AFTER_DAYS in @mathfamily/engine
  staleAfterDays = 60,
  now = new Date(),
  deltaLabel,
  oldestRowDate
}: {
  verifiedAt: string;
  staleAfterDays?: number;
  now?: Date;
  deltaLabel?: string;
  oldestRowDate?: string;
}) {
  const date = new Date(`${verifiedAt}T00:00:00Z`);
  const ageDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  const stale = ageDays > staleAfterDays;
  const formatted = fmtDate(verifiedAt);
  const mainLabel = oldestRowDate && oldestRowDate !== verifiedAt
    ? `Data from ${fmtDate(oldestRowDate)} to ${formatted}`
    : stale ? `Last verified ${formatted}` : `Verified ${formatted}`;
  return (
    <span
      className={
        stale
          ? "mf-fade-in inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-warning ring-1 ring-warning/20"
          : "mf-fade-in inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-positive ring-1 ring-positive/20"
      }
    >
      <CheckTick />
      {mainLabel}
      {deltaLabel ? <span className="text-ink-muted font-normal">{deltaLabel}</span> : null}
    </span>
  );
}

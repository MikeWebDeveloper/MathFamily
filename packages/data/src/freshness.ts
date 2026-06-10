export const FRESHNESS_WARN_DAYS = 60;
export const FRESHNESS_FAIL_DAYS = 120;

export interface FreshnessReport {
  warnings: string[];
  errors: string[];
}

export function freshnessReport(
  items: { label: string; verifiedAt: string }[],
  now: Date = new Date()
): FreshnessReport {
  const report: FreshnessReport = { warnings: [], errors: [] };
  for (const item of items) {
    const verified = new Date(`${item.verifiedAt}T00:00:00Z`).getTime();
    // verifiedAt is pre-validated as a real calendar date (IsoDate); future dates yield negative ageDays (no-op).
    const ageDays = Math.floor((now.getTime() - verified) / 86_400_000);
    if (ageDays > FRESHNESS_FAIL_DAYS) {
      report.errors.push(`${item.label}: ${ageDays} days since verification (limit ${FRESHNESS_FAIL_DAYS})`);
    } else if (ageDays > FRESHNESS_WARN_DAYS) {
      report.warnings.push(`${item.label}: ${ageDays} days since verification (warn after ${FRESHNESS_WARN_DAYS})`);
    }
  }
  return report;
}

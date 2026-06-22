import { formatPence } from "./money";

export interface DropOffBand {
  upToMinutes: number;
  totalPence: number;
}

export interface DropOffTariff {
  isFree: boolean;
  bands: DropOffBand[]; // cumulative totals; order-independent (smallest qualifying band wins)
  maxStayMinutes: number | null; // display metadata from the tariff page; not used in quoting
  perMinuteAfterPence: number | null; // published per-minute rate after the last band
  maxChargePence: number | null; // published cap on the total charge
  penaltyPence: number | null;
  // minutesFree is null for public-transport alternatives (rail/DLR to the terminal), which have
  // no "free minutes" concept; a positive integer for free car parks.
  freeAlternative: { name: string; minutesFree: number | null } | null;
  verifiedAt: string; // YYYY-MM-DD
}

export type DropOffWarningCode =
  | "PENALTY_RISK"
  | "FREE_ALTERNATIVE_EXISTS"
  | "DATA_UNVERIFIED_RECENTLY"
  | "BEYOND_TARIFF_UNKNOWN";

export interface DropOffWarning {
  code: DropOffWarningCode;
  message: string;
}

export interface DropOffQuote {
  costPence: number | null; // null when the published tariff doesn't cover the stay
  beyondTariff: boolean;
  warnings: DropOffWarning[];
  effectiveMinutes: number; // clamped integer minutes actually quoted
}

export const STALE_AFTER_DAYS = 60;

export function quoteDropOff(tariff: DropOffTariff, stayMinutes: number, now: Date = new Date()): DropOffQuote {
  const warnings: DropOffWarning[] = [];
  // Engines never throw on user input: clamp to a sane positive integer.
  const minutes = Math.max(1, Math.round(Number.isFinite(stayMinutes) ? stayMinutes : 1));

  const verified = new Date(`${tariff.verifiedAt}T00:00:00Z`).getTime();
  const ageDays = Math.floor((now.getTime() - verified) / 86_400_000);
  if (isNaN(ageDays) || ageDays > STALE_AFTER_DAYS) {
    warnings.push({
      code: "DATA_UNVERIFIED_RECENTLY",
      message: isNaN(ageDays)
        ? "Verification date is unreadable — check the official page before you travel."
        : `Last verified ${tariff.verifiedAt} — check the official page before you travel.`
    });
  }
  if (tariff.freeAlternative) {
    const fa = tariff.freeAlternative;
    warnings.push({
      code: "FREE_ALTERNATIVE_EXISTS",
      message:
        fa.minutesFree === null
          ? `${fa.name} reaches the terminal without using the paid forecourt.`
          : `${fa.name} is free for ${fa.minutesFree} minutes.`
    });
  }

  if (tariff.isFree) return { costPence: 0, beyondTariff: false, warnings, effectiveMinutes: minutes };

  // Select the smallest qualifying band so correctness doesn't depend on input ordering.
  let band: DropOffBand | undefined;
  for (const b of tariff.bands) {
    if (minutes <= b.upToMinutes && (band === undefined || b.upToMinutes < band.upToMinutes)) band = b;
  }
  if (band) return { costPence: band.totalPence, beyondTariff: false, warnings, effectiveMinutes: minutes };

  // The widest published band is the anchor for a per-minute continuation tail.
  let lastBand: DropOffBand | undefined;
  for (const b of tariff.bands) {
    if (lastBand === undefined || b.upToMinutes > lastBand.upToMinutes) lastBand = b;
  }

  // Honest per-minute continuation: when the published tariff continues at a per-minute rate
  // after the last band, quote the exact cost instead of implying a PCN. Within max stay only.
  // perMinuteAfterPence/maxChargePence come from external data; ignore malformed (non-integer/negative) values.
  if (
    lastBand &&
    tariff.perMinuteAfterPence !== null &&
    Number.isInteger(tariff.perMinuteAfterPence) &&
    tariff.perMinuteAfterPence > 0 &&
    !(tariff.maxStayMinutes !== null && minutes > tariff.maxStayMinutes)
  ) {
    let cost = lastBand.totalPence + (minutes - lastBand.upToMinutes) * tariff.perMinuteAfterPence;
    if (tariff.maxChargePence !== null && Number.isInteger(tariff.maxChargePence) && tariff.maxChargePence > 0) {
      cost = Math.min(cost, tariff.maxChargePence);
    }
    return { costPence: cost, beyondTariff: false, warnings, effectiveMinutes: minutes };
  }

  // penaltyPence comes from external data; only format values that are valid integer pence.
  if (
    tariff.penaltyPence !== null &&
    Number.isInteger(tariff.penaltyPence) &&
    tariff.penaltyPence >= 0 &&
    lastBand
  ) {
    warnings.push({
      code: "PENALTY_RISK",
      message: `The published tariff doesn't cover stays beyond ${lastBand.upToMinutes} minutes. Unpaid charges can lead to a ${formatPence(tariff.penaltyPence)} charge notice.`
    });
  } else {
    warnings.push({
      code: "BEYOND_TARIFF_UNKNOWN",
      message: "The published tariff doesn't cover stays this long — check the official page."
    });
  }
  return { costPence: null, beyondTariff: true, warnings, effectiveMinutes: minutes };
}

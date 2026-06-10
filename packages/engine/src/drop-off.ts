import { formatPence } from "./money";

export interface DropOffBand {
  upToMinutes: number;
  totalPence: number;
}

export interface DropOffTariff {
  isFree: boolean;
  bands: DropOffBand[]; // ascending by upToMinutes
  maxStayMinutes: number | null;
  penaltyPence: number | null;
  freeAlternative: { name: string; minutesFree: number } | null;
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
}

export const STALE_AFTER_DAYS = 60;

export function quoteDropOff(tariff: DropOffTariff, stayMinutes: number, now: Date = new Date()): DropOffQuote {
  const warnings: DropOffWarning[] = [];
  // Engines never throw on user input: clamp to a sane positive integer.
  const minutes = Math.max(1, Math.round(Number.isFinite(stayMinutes) ? stayMinutes : 1));

  const verified = new Date(`${tariff.verifiedAt}T00:00:00Z`).getTime();
  const ageDays = Math.floor((now.getTime() - verified) / 86_400_000);
  if (ageDays > STALE_AFTER_DAYS) {
    warnings.push({
      code: "DATA_UNVERIFIED_RECENTLY",
      message: `Last verified ${tariff.verifiedAt} — check the official page before you travel.`
    });
  }
  if (tariff.freeAlternative) {
    warnings.push({
      code: "FREE_ALTERNATIVE_EXISTS",
      message: `${tariff.freeAlternative.name} is free for ${tariff.freeAlternative.minutesFree} minutes.`
    });
  }

  if (tariff.isFree) return { costPence: 0, beyondTariff: false, warnings };

  const band = tariff.bands.find((b) => minutes <= b.upToMinutes);
  if (band) return { costPence: band.totalPence, beyondTariff: false, warnings };

  const lastBand = tariff.bands[tariff.bands.length - 1];
  if (tariff.penaltyPence !== null && lastBand) {
    warnings.push({
      code: "PENALTY_RISK",
      message: `Stays beyond ${lastBand.upToMinutes} minutes risk a ${formatPence(tariff.penaltyPence)} charge notice.`
    });
  } else {
    warnings.push({
      code: "BEYOND_TARIFF_UNKNOWN",
      message: "The published tariff doesn't cover stays this long — check the official page."
    });
  }
  return { costPence: null, beyondTariff: true, warnings };
}

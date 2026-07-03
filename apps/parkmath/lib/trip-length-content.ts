import { compareParking, formatPence } from "@mathfamily/engine";
import type { ParkingRecord } from "@mathfamily/data";

/**
 * Short trip vs long stay — cost-per-day by trip length (2026-07-03 parking sprint, tranche 2 item 8).
 *
 * Built ONLY from `compareParking`, the same verified-pricing engine every other duration-aware page
 * on the site already uses. Every duration is checked independently against the dataset — nothing is
 * interpolated or assumed to carry over from a neighbouring duration. Two honest constraints drive the
 * design:
 *
 *  1. Gate parking is published at exactly 3/7/14 days for every airport that has a parking record
 *     (verified 2026-07-03: all 12 airports qualifying for parking-vs-drop-off cover all three).
 *  2. Pre-book "from" snapshots are sparse and often land on an OFF-GRID duration (e.g. Stansted/
 *     Manchester publish an 8-day snapshot, not 7). A pre-book column is populated ONLY where the
 *     dataset holds a snapshot at that EXACT duration (Glasgow's is at day 7) — never estimated by
 *     scaling a different duration's price, which would be a fabricated number.
 *
 * No walk-distance field exists anywhere in the parking dataset (checked 2026-07-03) — the task's
 * "walk distance where known" is therefore always omitted, which is the correct fail-closed behaviour,
 * not a gap.
 */

export const TRIP_LENGTH_DAYS = [3, 7, 14] as const;

export interface TripLengthRow {
  days: number;
  label: string;
  gatePence: number | null;
  gatePerDayPence: number | null;
  /** A verified pre-book price ONLY when the dataset has a snapshot at this exact duration; else null. */
  prebookPence: number | null;
  prebookPerDayPence: number | null;
  cheaperOption: "gate" | "prebook" | "tie" | null;
  /** Pre-book saving vs the gate price, integer pence, only when prebook is strictly cheaper. */
  savingPence: number | null;
}

export interface TripLengthModel {
  rows: TripLengthRow[];
  /** True when at least one row has a same-duration pre-book snapshot to compare against the gate. */
  hasAnyPrebook: boolean;
  /** True when the gate per-day rate is identical across every covered duration (a real, common
   *  pattern here — most tariffs are a flat daily rate) — the model states this honestly either way. */
  flatGateRate: boolean;
  /** The single "which is cheaper for your trip length" verdict sentence. Every figure in it traces
   *  to a row above. */
  verdict: string;
  verifiedAt: string;
}

/** Build the trip-length model for an airport's parking record. Returns null when the record has no
 *  gate price at ANY of the three reference durations (nothing to build a table from). Pure + tested. */
export function tripLengthModel(record: ParkingRecord, airportName: string): TripLengthModel | null {
  const rows: TripLengthRow[] = [];
  let hasAnyPrebook = false;

  for (const days of TRIP_LENGTH_DAYS) {
    const cmp = compareParking(record, days);
    if (!cmp.gate) continue; // no gate price published for this exact duration — skip, never estimate

    const prebookOption = cmp.options.find((o) => o.productType === "prebook") ?? null;
    const gatePerDayPence = Math.round(cmp.gate.totalPence / days);
    const prebookPerDayPence = prebookOption ? Math.round(prebookOption.totalPence / days) : null;

    let cheaperOption: TripLengthRow["cheaperOption"] = null;
    let savingPence: number | null = null;
    if (prebookOption) {
      hasAnyPrebook = true;
      if (prebookOption.totalPence < cmp.gate.totalPence) {
        cheaperOption = "prebook";
        savingPence = cmp.gate.totalPence - prebookOption.totalPence;
      } else if (prebookOption.totalPence > cmp.gate.totalPence) {
        cheaperOption = "gate";
      } else {
        cheaperOption = "tie";
      }
    }

    rows.push({
      days,
      label: `${days} days`,
      gatePence: cmp.gate.totalPence,
      gatePerDayPence,
      prebookPence: prebookOption?.totalPence ?? null,
      prebookPerDayPence,
      cheaperOption,
      savingPence
    });
  }

  if (rows.length === 0) return null;

  const gatePerDayRates = rows.map((r) => r.gatePerDayPence).filter((p): p is number => p !== null);
  const flatGateRate = gatePerDayRates.length > 1 && gatePerDayRates.every((p) => p === gatePerDayRates[0]);
  const prebookWin = rows.find((r) => r.cheaperOption === "prebook" && r.savingPence !== null);

  let verdict: string;
  if (prebookWin) {
    verdict =
      `At ${airportName}, the drive-up gate rate is ${formatPence(rows[0]!.gatePerDayPence ?? 0)} a day` +
      `${flatGateRate ? " whatever your trip length" : ""}. Pre-booking a ${prebookWin.label} stay beats the ` +
      `gate by ${formatPence(prebookWin.savingPence!)} — book ahead for that trip length.`;
  } else if (flatGateRate) {
    verdict =
      `At ${airportName}, drive-up gate parking costs the same ${formatPence(gatePerDayRates[0] ?? 0)} a day whether ` +
      `you're staying ${rows[0]!.label} or ${rows[rows.length - 1]!.label} — a short trip isn't cheaper per day ` +
      `than a long one at the gate here. We hold no verified pre-book price that beats it yet.`;
  } else {
    verdict =
      `At ${airportName}, the drive-up gate per-day rate changes with trip length — see the table for the exact ` +
      `rate at each duration. We hold no verified pre-book price that beats it yet.`;
  }

  return { rows, hasAnyPrebook, flatGateRate, verdict, verifiedAt: record.verifiedAt };
}

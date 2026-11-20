import { formatPence } from "@mathfamily/engine";
import type { DropOffRecord } from "@mathfamily/data";

/*
 * Payment wording for drop-off charges, derived only from the record's `paymentDeadline` (the
 * airport's own words) and penalty fields. Shared by the drop-off, Blue Badge and avoid pages so none
 * of them splices barrier wording into a "pay by …" sentence again (Nov 2026: "Newcastle
 * International Airport lets you pay by Ticketless ANPR — … paid on exit").
 */

/**
 * How a drop-off charge is paid, read only from the airport's own `paymentDeadline` wording.
 * - "pay-later": the wording states a deadline after the visit (midnight / 23:59 / the day after).
 *   Checked first, because pay-later wording can still mention a barrier or exit ("Barrier-free …
 *   payment cannot be made on exit").
 * - "pay-on-exit": barrier / on-exit / exit-barrier / payment-station wording.
 * - "unknown": no wording, or wording that says neither. Pages then claim nothing about method.
 */
export type DropOffPaymentMode = "pay-later" | "pay-on-exit" | "unknown";

const PAY_LATER = /midnight|23:59|the day after|following day/i;
const PAY_ON_EXIT = /on exit|barrier|payment station|on leaving/i;
const NOT_AT_A_BARRIER = /barrierless|barrier-free|barrier free|online/i;

export function dropOffPaymentMode(record: Pick<DropOffRecord, "paymentDeadline">): DropOffPaymentMode {
  const t = record.paymentDeadline;
  if (!t) return "unknown";
  if (PAY_LATER.test(t)) return "pay-later";
  // "Barrierless" / "Barrier-free" / "online" contain or imply the opposite of a barrier you pay at;
  // without a stated deadline they stay unknown rather than become a wrong "you pay as you leave".
  if (NOT_AT_A_BARRIER.test(t)) return "unknown";
  if (PAY_ON_EXIT.test(t)) return "pay-on-exit";
  return "unknown";
}

/** The deadline itself ("23:59 the day after your visit"), lifted out of the airport's wording so a
 *  sentence can say "pay by …" without splicing in "Barrier-free — pay online by …". Null unless
 *  the record is pay-later. */
export function payByPhrase(record: Pick<DropOffRecord, "paymentDeadline">): string | null {
  if (dropOffPaymentMode(record) !== "pay-later") return null;
  const m = record.paymentDeadline!.match(/(midnight|23:59)[^(;,]*/i);
  if (!m) return null;
  const phrase = m[0].trim();
  return phrase.charAt(0).toLowerCase() + phrase.slice(1);
}

export function paymentDeadlineChip(record: Pick<DropOffRecord, "paymentDeadline">): string | null {
  const mode = dropOffPaymentMode(record);
  if (mode === "pay-later") {
    const by = payByPhrase(record);
    return by ? `Pay by: ${by}` : `Pay by: ${record.paymentDeadline}`;
  }
  if (mode === "pay-on-exit") return "Pay on exit";
  return null;
}


/** One clause, always starting with the airport name, so it reads after "Where …, " too:
 *  pay-later "X lets you pay by 23:59 the day after your visit"; pay-on-exit "X takes payment as you
 *  leave the drop-off zone, not afterwards"; otherwise the airport's wording, quoted. */
export function payInstruction(record: Pick<DropOffRecord, "paymentDeadline">, airportName: string): string | null {
  if (!record.paymentDeadline) return null;
  const mode = dropOffPaymentMode(record);
  if (mode === "pay-later") return `${airportName} lets you pay by ${payByPhrase(record) ?? record.paymentDeadline}`;
  if (mode === "pay-on-exit") return `${airportName} takes payment as you leave the drop-off zone, not afterwards`;
  return `${airportName}'s payment wording: ${record.paymentDeadline.replace(/\.$/, "")}`;
}

/** " — missing it risks a £100 penalty" (pay-later: there is a deadline to miss) or " — the penalty is
 *  £50" (otherwise). Empty when the record has no penalty amount. */
export function penaltyClause(record: Pick<DropOffRecord, "paymentDeadline" | "penaltyPence">): string {
  if (record.penaltyPence === null) return "";
  return dropOffPaymentMode(record) === "pay-later"
    ? ` — missing it risks a ${formatPence(record.penaltyPence)} penalty`
    : ` — the penalty is ${formatPence(record.penaltyPence)}`;
}

/** The pay instruction as a sentence plus its penalty, for the "If a charge still applies" callouts. */
export function payInstructionWithPenalty(record: Pick<DropOffRecord, "paymentDeadline" | "penaltyPence">, airportName: string): string | null {
  const instruction = payInstruction(record, airportName);
  return instruction ? `${instruction}${penaltyClause(record)}.` : null;
}

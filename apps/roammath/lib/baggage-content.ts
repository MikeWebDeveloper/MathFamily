import { formatPence } from "@mathfamily/engine";
import type { BaggageFee, BaggageRecord } from "@mathfamily/data";

export function feeRangeLabel(fee: BaggageFee): string {
  if (fee.minPence === null && fee.maxPence === null) return "Not published";
  if (fee.minPence === 0 && fee.maxPence === 0) return "Free";
  if (fee.minPence !== null && fee.maxPence !== null && fee.minPence !== fee.maxPence) {
    return `${formatPence(fee.minPence)}–${formatPence(fee.maxPence)}`;
  }
  const single = fee.minPence ?? fee.maxPence;
  return single === null ? "Not published" : formatPence(single);
}

export function baggageAnswer(record: BaggageRecord): string {
  const cabin = record.fees.find((f) => f.item.toLowerCase().includes("cabin"));
  const checked = record.fees.find((f) => f.item.toLowerCase().includes("checked") || /\b\d{2}kg\b/.test(f.item));
  const parts: string[] = [];
  if (cabin) parts.push(`a ${cabin.item.toLowerCase()} costs ${feeRangeLabel(cabin)}`);
  if (checked && checked !== cabin) parts.push(`${checked.item.toLowerCase()}: ${feeRangeLabel(checked)}`);
  return `${record.airlineName} bag fees: ${parts.length ? parts.join("; ") : "see the published table below"} (official published ranges — exact prices vary by route and date).`;
}

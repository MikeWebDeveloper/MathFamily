export function formatPence(pence: number): string {
  if (!Number.isInteger(pence) || pence < 0) {
    throw new Error(`formatPence expects a non-negative integer of pence, got ${pence}`);
  }
  const pounds = Math.floor(pence / 100);
  const rem = pence % 100;
  const poundsStr = pounds.toLocaleString("en-GB");
  return rem === 0 ? `£${poundsStr}` : `£${poundsStr}.${String(rem).padStart(2, "0")}`;
}

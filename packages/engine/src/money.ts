/** Formats non-negative integer pence as GBP. Values above Number.MAX_SAFE_INTEGER are not supported. */
export function formatPence(pence: number): string {
  if (!Number.isInteger(pence) || pence < 0) {
    throw new Error(`formatPence expects a non-negative integer of pence, got ${pence}`);
  }
  const pounds = Math.floor(pence / 100);
  const rem = pence % 100;
  const poundsStr = pounds.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return rem === 0 ? `£${poundsStr}` : `£${poundsStr}.${String(rem).padStart(2, "0")}`;
}

/** Appends a single trailing full stop, never a second one. Several data-sourced fields
 *  (e.g. `fairUseNote`) already end with their own period (e.g. "...25GB cap."), so blindly
 *  concatenating a literal "." after them produces a double-period ("...cap.."). Shared by
 *  both the roaming FAQPage JSON-LD and the roaming-trip engine's on-page warning text. */
export function terminate(sentence: string): string {
  return sentence.endsWith(".") ? sentence : `${sentence}.`;
}

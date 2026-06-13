/** Minimal RFC 4180 CSV serialiser. Quotes any cell containing a comma, quote or newline;
 *  doubles embedded quotes; renders null/undefined as empty. CRLF line endings + trailing CRLF. */
function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(header: string[], rows: (string | number | null | undefined)[][]): string {
  return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

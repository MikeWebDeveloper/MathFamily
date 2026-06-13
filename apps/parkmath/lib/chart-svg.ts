/** Pure SVG builder for a branded "gate vs pre-book" parking chart (1200×630 — OG/social/
 *  image-search friendly). Standalone image, so colours are literal (no CSS vars). */
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function gbp(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

export function parkingChartSvg(input: {
  airportName: string;
  iata: string;
  gatePence: number;
  prebookPence: number;
  prebookName: string;
  verifiedAt: string;
  days?: number;
}): string {
  const days = input.days ?? 7;
  const saving = Math.max(0, input.gatePence - input.prebookPence);
  const max = Math.max(input.gatePence, input.prebookPence, 1);
  const barMax = 720;
  const gateW = Math.max(2, Math.round((input.gatePence / max) * barMax));
  const prebookW = Math.max(2, Math.round((input.prebookPence / max) * barMax));
  const name = esc(input.airportName);
  const font = `font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif"`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${name} ${days}-day airport parking: drive-up gate ${gbp(input.gatePence)} versus pre-book ${gbp(input.prebookPence)}, saving ${gbp(saving)}">
  <rect width="1200" height="630" fill="#f8fafc"/>
  <rect width="1200" height="12" fill="#0ea5a4"/>
  <text x="80" y="118" ${font} font-size="52" font-weight="700" fill="#0f172a">${name} airport parking</text>
  <text x="80" y="168" ${font} font-size="28" fill="#475569">Drive-up gate vs pre-book · ${days} days · verified ${esc(input.verifiedAt)}</text>

  <text x="80" y="268" ${font} font-size="26" font-weight="600" fill="#0f172a">Drive-up gate</text>
  <rect x="80" y="288" width="${gateW}" height="62" rx="8" fill="#dc2626"/>
  <text x="${80 + gateW + 20}" y="330" ${font} font-size="34" font-weight="700" fill="#0f172a">${gbp(input.gatePence)}</text>

  <text x="80" y="418" ${font} font-size="26" font-weight="600" fill="#0f172a">Pre-book (${esc(input.prebookName)})</text>
  <rect x="80" y="438" width="${prebookW}" height="62" rx="8" fill="#16a34a"/>
  <text x="${80 + prebookW + 20}" y="480" ${font} font-size="34" font-weight="700" fill="#0f172a">${gbp(input.prebookPence)}</text>

  <text x="80" y="566" ${font} font-size="40" font-weight="700" fill="#16a34a">Save ${gbp(saving)} by pre-booking</text>
  <text x="1120" y="598" text-anchor="end" ${font} font-size="28" font-weight="700" fill="#0ea5a4">parkmath.co.uk</text>
</svg>`;
}

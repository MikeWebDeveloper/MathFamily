import { formatPence } from "@mathfamily/engine";
import type { LeagueEntry } from "./content";

/**
 * The embeddable drop-off-charges widget — the #1 faceless-friendly link magnet.
 *
 * A third-party site drops in an <iframe> (or the resize-aware <script> snippet) pointing at
 * `/embed/drop-off-charges` (the whole league table) or `/embed/drop-off-charges?airport=<slug>`
 * (a single airport's fee). The iframe route serves a fully self-contained HTML document — its own
 * inline CSS, no site chrome, no external requests — with an attribution link back to ParkMath baked
 * in (the link is the whole point: every embed is an evergreen, self-serve backlink + brand mention).
 *
 * This module builds that HTML as a pure string so it can be unit-tested and reused by both the
 * iframe route handler and the `/embed` copy-paste page's live preview. Real data only: it renders
 * exactly the league passed in (built from the verified dataset) and never fabricates a fee.
 */

export interface EmbedWidgetOptions {
  /** Origin used for the attribution link + per-row source links, e.g. "https://parkmath.co.uk". */
  siteUrl: string;
  /** The verified league (already ranked) to render. */
  league: LeagueEntry[];
  /** Latest verification date (ISO) shown in the freshness line. */
  verifiedAt: string;
  /** When set, render the single-airport card for this slug instead of the full table. */
  airportSlug?: string;
  /** Optional theme; "auto" follows the embedding page's prefers-color-scheme. */
  theme?: "light" | "dark" | "auto";
}

/** HTML-escape a value for safe interpolation into the widget markup. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Human-readable verified date, e.g. "10 June 2026". Falls back to the raw string if unparseable. */
export function formatVerifiedDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

function perMinCell(e: LeagueEntry): string {
  if (e.perMinutePence !== null) return `${formatPence(Math.round(e.perMinutePence))}/min`;
  return e.isFree ? "Free" : "Flat fee";
}

function feeCell(e: LeagueEntry): string {
  return e.isFree ? "Free" : formatPence(e.feePence);
}

/** The widget's inline stylesheet. Self-contained, system-font, theme-aware, zero external assets. */
const WIDGET_CSS = `
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  color:#0f172a;background:#fff;font-size:14px;line-height:1.45;-webkit-font-smoothing:antialiased}
.pm{padding:14px 16px}
.pm-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:8px}
.pm-title{font-size:15px;font-weight:700;margin:0}
.pm-fresh{font-size:11px;color:#475569;white-space:nowrap}
table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}
caption{caption-side:top;text-align:left;font-size:12px;color:#475569;margin-bottom:6px}
th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #e2e8f0}
th{font-size:11px;text-transform:uppercase;letter-spacing:.03em;color:#475569;font-weight:600}
td.n,th.n{text-align:right}
tbody tr:nth-child(odd){background:#f8fafc}
a{color:#1d4ed8;text-decoration:none}
a:hover{text-decoration:underline}
.pm-card{display:flex;flex-direction:column;gap:4px}
.pm-card .big{font-size:30px;font-weight:800;line-height:1.05}
.pm-card .sub{font-size:13px;color:#475569}
.pm-attr{margin-top:10px;padding-top:8px;border-top:1px solid #e2e8f0;font-size:11px;color:#475569;
  display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.pm-attr a{font-weight:600}
.pm-badge{display:inline-block;font-size:10px;font-weight:700;color:#15803d;background:#dcfce7;
  border-radius:4px;padding:1px 5px}
@media (prefers-color-scheme:dark){
  .pm-dark-auto body,body.pm-dark-auto{background:#0b1220;color:#e2e8f0}
}
.pm-dark body,body.pm-dark{background:#0b1220;color:#e2e8f0}
.pm-dark th,.pm-dark caption,.pm-dark .pm-fresh,.pm-dark .pm-attr,.pm-dark .sub{color:#94a3b8}
.pm-dark th,.pm-dark td{border-color:#1e293b}
.pm-dark tbody tr:nth-child(odd){background:#0f1729}
.pm-dark a{color:#60a5fa}
.pm-dark .pm-badge{color:#bbf7d0;background:#14532d}
`.trim();

/** The resize beacon: posts the document height to the parent so the script-embed iframe can fit
 *  its content with no scrollbars. No-ops (harmlessly) for a raw iframe embed. */
const RESIZE_SCRIPT = `
(function(){function h(){try{var d=document.documentElement,b=document.body,
n=Math.max(d.scrollHeight,b?b.scrollHeight:0,d.offsetHeight);
parent.postMessage({type:"parkmath-embed-height",height:n},"*")}catch(e){}}
window.addEventListener("load",h);window.addEventListener("resize",h);
if(window.ResizeObserver){try{new ResizeObserver(h).observe(document.body)}catch(e){}}
setTimeout(h,250)})();
`.trim();

function bodyClass(theme: EmbedWidgetOptions["theme"]): string {
  if (theme === "dark") return "pm-dark";
  if (theme === "auto") return "pm-dark-auto";
  return "";
}

/** Build the single-airport fee card. Returns null when the slug isn't in the league. */
function buildCard(opts: EmbedWidgetOptions): string | null {
  const e = opts.league.find((x) => x.airportSlug === opts.airportSlug);
  if (!e) return null;
  const name = escapeHtml(e.name);
  const spoke = `${opts.siteUrl}/drop-off-charges/${encodeURIComponent(e.airportSlug)}`;
  const sub = e.isFree
    ? "is free to drop off"
    : e.perMinutePence !== null
      ? `for up to ${e.minutes} min &middot; ${escapeHtml(formatPence(Math.round(e.perMinutePence)))}/min`
      : "per entry (flat fee)";
  return `<div class="pm-card">
    <div class="big">${escapeHtml(feeCell(e))}</div>
    <div class="sub"><a href="${spoke}" target="_blank" rel="noopener">${name}</a> drop-off charge ${sub}</div>
  </div>`;
}

/** Build the full league table. */
function buildTable(opts: EmbedWidgetOptions): string {
  const rows = opts.league
    .map((e, i) => {
      const spoke = `${opts.siteUrl}/drop-off-charges/${encodeURIComponent(e.airportSlug)}`;
      return `<tr>
        <td class="n">${i + 1}</td>
        <td><a href="${spoke}" target="_blank" rel="noopener">${escapeHtml(e.name)}</a></td>
        <td class="n">${escapeHtml(feeCell(e))}</td>
        <td class="n">${escapeHtml(perMinCell(e))}</td>
        <td class="n">${e.isFree ? "&mdash;" : e.isPerEntry ? "Per entry" : `${e.minutes} min`}</td>
      </tr>`;
    })
    .join("");
  return `<table>
    <caption>Ranked worst-value first, by effective cost per minute. Every figure verified against the airport&rsquo;s own official page.</caption>
    <thead><tr>
      <th class="n">#</th><th>Airport</th><th class="n">Fee</th><th class="n">&pound;/min</th><th class="n">You get</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

/**
 * Build the complete, self-contained widget HTML document. Pure: same inputs → same output.
 * The attribution link back to ParkMath is always present — it is the value the embed gives back.
 */
export function buildEmbedWidgetHtml(opts: EmbedWidgetOptions): string {
  const single = opts.airportSlug ? buildCard(opts) : null;
  const inner = single ?? buildTable(opts);
  const title = single ? "Airport drop-off charge" : "UK airport drop-off charges 2026";
  // Attribution points at the canonical, citable Price Index (the press / "cite us" asset) so every
  // embed consolidates link equity on one URL rather than splitting it with the hub.
  const indexUrl = `${opts.siteUrl}/drop-off-charges/price-index`;
  const verified = formatVerifiedDate(opts.verifiedAt);
  const cls = bodyClass(opts.theme);

  return `<!doctype html>
<html lang="en-GB"${cls ? ` class="${cls}"` : ""}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapeHtml(title)} — ParkMath</title>
<style>${WIDGET_CSS}</style>
</head>
<body${cls ? ` class="${cls}"` : ""}>
<div class="pm">
  <div class="pm-head">
    <h2 class="pm-title">${escapeHtml(title)}</h2>
    <span class="pm-fresh"><span class="pm-badge">Verified</span> ${escapeHtml(verified)}</span>
  </div>
  ${inner}
  <div class="pm-attr">
    <span>Source: <a href="${indexUrl}" target="_blank" rel="noopener">ParkMath</a> &mdash; verified UK airport fees</span>
    <a href="${indexUrl}" target="_blank" rel="noopener">parkmath.co.uk &rarr;</a>
  </div>
</div>
<script>${RESIZE_SCRIPT}</script>
</body>
</html>`;
}

/** The widget URL for a publisher: the full table, or a single airport's fee (path-based). */
export function embedSrc(siteUrl: string, airportSlug?: string): string {
  return airportSlug
    ? `${siteUrl}/embed/drop-off-charges/${encodeURIComponent(airportSlug)}`
    : `${siteUrl}/embed/drop-off-charges`;
}

/** The iframe snippet a publisher pastes. `airportSlug` selects the single-airport variant. */
export function buildIframeSnippet(siteUrl: string, airportSlug?: string): string {
  const src = embedSrc(siteUrl, airportSlug);
  const height = airportSlug ? 200 : 640;
  return `<iframe src="${src}" title="UK airport drop-off charges — ParkMath" width="100%" height="${height}" style="border:1px solid #e2e8f0;border-radius:10px;max-width:640px" loading="lazy"></iframe>`;
}

/** The resize-aware script snippet: an iframe + a tiny listener that fits it to its content. */
export function buildScriptSnippet(siteUrl: string, airportSlug?: string): string {
  const src = embedSrc(siteUrl, airportSlug);
  return `<iframe id="parkmath-embed" src="${src}" title="UK airport drop-off charges — ParkMath" width="100%" height="640" scrolling="no" style="border:1px solid #e2e8f0;border-radius:10px;max-width:640px"></iframe>
<script>window.addEventListener("message",function(e){if(e.data&&e.data.type==="parkmath-embed-height"){var f=document.getElementById("parkmath-embed");if(f)f.style.height=e.data.height+"px";}});</script>`;
}

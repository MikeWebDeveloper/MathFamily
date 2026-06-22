/**
 * GET /widget/drop-off-index
 *
 * Delivers a compact (~280×160 – 640×200), self-contained, server-rendered
 * index widget as a complete HTML document.
 *
 * Design characteristics:
 *   - IBM Plex Sans (loaded from Google Fonts — same brand typeface as the
 *     main site). Falls back to ui-sans-serif in browsers that block fonts.
 *   - Deep navy headline stat, verified-green badge, static SVG sparkline.
 *   - No React hydration on the publisher's page (the widget is inside an
 *     iframe; any client JS runs only in the iframe's own browsing context).
 *   - ~10 KB total HTML+CSS+JS (resize beacon only).
 *   - prefers-reduced-motion: sparkline has no animation; CSS honours the
 *     media query to suppress the entry fade.
 *   - Crawlable: a visually-hidden <table> carries all numbers as plain HTML
 *     so search crawlers and AI citation engines see the data directly.
 *
 * CSP / framing:
 *   next.config.ts already sets `frame-ancestors *` for /widget/:path* routes.
 *   This route also adds no X-Frame-Options, letting the CSP directive win.
 *
 * Caching:
 *   force-static → Edge CDN caches the full HTML. Revalidated on next deploy.
 */

import { loadAirports, loadDropOffDataset } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { buildDropOffLeague, dearestDropOff } from "@/lib/content";

export const dynamic = "force-static";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// ─── Inline CSS ──────────────────────────────────────────────────────────────
// Goal: ~1.5 KB. Uses IBM Plex Sans (Google Fonts, subset=latin, display=swap)
// which is pre-connected and non-blocking. No Tailwind; no external assets
// beyond the font (the sparkline is inline SVG).
const WIDGET_CSS = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%}
body{
  font-family:"IBM Plex Sans",ui-sans-serif,system-ui,-apple-system,sans-serif;
  -webkit-font-smoothing:antialiased;font-size:13px;line-height:1.45;
  background:transparent
}
.pm-widget{
  background:#fff;color:#0f172a;
  border-radius:12px;
  border:1px solid rgba(15,23,42,.08);
  box-shadow:0 1px 3px rgba(15,23,42,.06),0 12px 32px -8px rgba(15,23,42,.1);
  overflow:hidden;
  font-family:inherit;
  width:100%;
  max-width:640px
}
/* ── Header ─────────────────────────────────────── */
.pm-header{
  display:flex;align-items:center;justify-content:space-between;
  gap:8px;flex-wrap:wrap;padding:13px 16px 0;min-width:0
}
.pm-title{
  font-size:13px;font-weight:700;letter-spacing:-.015em;
  color:#0f172a;line-height:1.3
}
.pm-badge{
  display:inline-flex;align-items:center;gap:4px;
  font-size:10px;font-weight:600;color:#16a34a;
  background:rgba(22,163,74,.09);border:1px solid rgba(22,163,74,.2);
  border-radius:999px;padding:2px 8px;white-space:nowrap;flex-shrink:0
}
.pm-badge svg{display:block;flex-shrink:0}
/* ── Body ───────────────────────────────────────── */
.pm-body{padding:11px 16px 13px}
.pm-stat-row{
  display:flex;align-items:center;justify-content:space-between;
  gap:12px;margin-bottom:11px
}
.pm-stat-left{min-width:0;flex:1}
.pm-stat-label{
  font-size:9px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;
  color:#94a3b8;line-height:1.3;margin-bottom:3px
}
.pm-stat-val-wrap{display:flex;align-items:baseline;gap:7px;flex-wrap:wrap}
.pm-big{
  font-family:"IBM Plex Mono","IBM Plex Sans",ui-monospace,monospace;
  font-size:clamp(1.5rem,6vw,2.125rem);font-weight:700;
  letter-spacing:-.02em;color:#0a2540;line-height:1;
  font-variant-numeric:tabular-nums
}
.pm-airport{
  font-size:11px;font-weight:500;color:#64748b;
  line-height:1.3
}
.pm-spark{flex-shrink:0;align-self:center}
/* ── Divider ────────────────────────────────────── */
.pm-divider{border:none;border-top:1px solid rgba(15,23,42,.07);margin:0 0 11px}
/* ── Secondary stats grid ───────────────────────── */
.pm-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:11px}
.pm-stat-sm-label{
  font-size:9px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;
  color:#94a3b8;line-height:1.3;margin-bottom:2px
}
.pm-stat-sm-val{
  font-size:14px;font-weight:700;font-variant-numeric:tabular-nums;
  line-height:1.15;color:#0f172a
}
.pm-stat-sm-sub{font-size:10px;color:#64748b;line-height:1.3;margin-top:1px}
.pm-positive{color:#16a34a}
/* ── CTA ────────────────────────────────────────── */
.pm-cta a{
  font-size:11px;font-weight:600;color:#2563eb;
  text-decoration:none;letter-spacing:-.01em;
  touch-action:manipulation
}
.pm-cta a:hover{text-decoration:underline}
/* ── Footer ─────────────────────────────────────── */
.pm-footer{
  padding:8px 16px;
  border-top:1px solid rgba(15,23,42,.07);
  display:flex;align-items:center;justify-content:space-between;
  gap:8px;flex-wrap:wrap;
  background:#fafbfc
}
.pm-source{font-size:10px;color:#64748b;line-height:1.4}
.pm-source a{color:#2563eb;font-weight:600;text-decoration:none;touch-action:manipulation}
.pm-attr-link{
  font-size:10px;font-weight:600;color:#2563eb;
  text-decoration:none;white-space:nowrap;touch-action:manipulation
}
/* ── Focus styles (WCAG 2.1 AA visible focus) ─── */
a:focus-visible{
  outline:2px solid #2563eb;outline-offset:2px;border-radius:3px
}
/* ── Screen-reader only ─────────────────────────── */
.pm-sr{
  position:absolute;width:1px;height:1px;
  overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap
}
/* prefers-reduced-motion */
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
`.trim();

// Resize beacon — same as the existing embed widgets
const RESIZE_SCRIPT = `
(function(){function h(){try{var d=document.documentElement,b=document.body,
n=Math.max(d.scrollHeight,b?b.scrollHeight:0,d.offsetHeight);
parent.postMessage({type:"parkmath-embed-height",height:n},"*")}catch(e){}}
window.addEventListener("load",h);window.addEventListener("resize",h);
if(window.ResizeObserver){try{new ResizeObserver(h).observe(document.body)}catch(e){}}
setTimeout(h,250)})();
`.trim();

// ─── SVG Sparkline ───────────────────────────────────────────────────────────
function buildSparkline(data: number[], width = 72, height = 32): string {
  if (!data || data.length < 2) return "";
  const max = Math.max(...data);
  const min = Math.min(...data);
  const rng = max - min || 1;
  const last = data[data.length - 1]!;
  const first = data[0]!;
  const up = last > first;
  const flat = last === first;
  const color = flat ? "#94a3b8" : up ? "#b45309" : "#16a34a";
  const y = (v: number) => height - 2 - ((v - min) / rng) * (height - 4);
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * width},${y(v).toFixed(1)}`)
    .join(" ");
  const dotCx = width;
  const dotCy = y(last).toFixed(1);
  return `<svg width="${width}" height="${height}" aria-hidden="true" focusable="false" style="display:block;overflow:visible">
  <polyline points="${points}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"${flat ? ' opacity="0.45"' : ""} />
  ${!flat ? `<circle cx="${dotCx}" cy="${dotCy}" r="3" fill="${color}" />` : ""}
</svg>`;
}

// ─── HTML builder ────────────────────────────────────────────────────────────
function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fmtDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  });
}

export async function GET() {
  const airports = new Map(loadAirports().map((a) => [a.slug, a]));
  const dataset = loadDropOffDataset();
  const nameFor = (slug: string) => airports.get(slug)?.name ?? slug;

  const league = buildDropOffLeague(dataset.records, nameFor);
  const latestVerified =
    dataset.records.map((r) => r.verifiedAt).sort().at(-1) ?? dataset.lastUpdated;

  // Headline: most expensive airport
  const dearest = dearestDropOff(dataset.records);
  const dearestName = dearest ? nameFor(dearest.airportSlug) : "Unknown";
  const dearestFee = dearest ? formatPence(dearest.pence) : "—";

  // Cheapest paying airport
  const cheapest = [...league]
    .filter((e) => !e.isFree)
    .sort((a, b) => a.feePence - b.feePence)[0];
  const cheapestName = cheapest ? nameFor(cheapest.airportSlug) : null;
  const cheapestFee = cheapest ? formatPence(cheapest.feePence) : null;

  const chargingCount = league.filter((e) => !e.isFree).length;
  const totalCount = league.length;

  // Sparkline: real 2025→2026 data for the headline airport
  const topRecord = dearest
    ? dataset.records.find((r) => r.airportSlug === dearest.airportSlug)
    : null;
  const priorFee =
    topRecord?.priorYearFeePence !== null &&
    topRecord?.priorYearFeePence !== undefined &&
    topRecord.priorYearFeePence > 0
      ? topRecord.priorYearFeePence
      : dearest?.pence ?? 0;
  const sparklineData = [priorFee, dearest?.pence ?? 0];

  const hubUrl = `${SITE_URL}/drop-off-charges`;
  const verifiedLabel = fmtDate(latestVerified);
  const sparkSvg = buildSparkline(sparklineData, 72, 32);

  const html = `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>UK airport drop-off fees — ParkMath</title>
<style>${WIDGET_CSS}</style>
</head>
<body>

<div class="pm-widget" role="region" aria-label="UK airport drop-off fees — ParkMath">

  <!-- ── Header ── -->
  <div class="pm-header">
    <h2 class="pm-title">UK airport drop-off fees</h2>
    <span class="pm-badge" aria-label="Data verified ${escHtml(verifiedLabel)}">
      <svg viewBox="0 0 10 10" width="9" height="9" fill="none">
        <path d="M2 5.5 4.2 7.5 8 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>Verified ${escHtml(verifiedLabel)}</span>
    </span>
  </div>

  <!-- ── Visually hidden data table (crawlable / AI-citable) ── -->
  <table class="pm-sr" aria-label="UK airport drop-off charges summary 2026">
    <caption>UK airport drop-off charges 2026 — verified against official airport pages. Source: ParkMath.co.uk</caption>
    <thead>
      <tr><th scope="col">Airport</th><th scope="col">Drop-off fee (2026)</th><th scope="col">Status</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>${escHtml(dearestName)}</td>
        <td>${escHtml(dearestFee)}</td>
        <td>Most expensive UK airport drop-off 2026</td>
      </tr>
      ${cheapestName && cheapestFee ? `<tr>
        <td>${escHtml(cheapestName)}</td>
        <td>${escHtml(cheapestFee)}</td>
        <td>Cheapest UK airport that charges for drop-off 2026</td>
      </tr>` : ""}
      <tr>
        <td colspan="2">Airports that charge for drop-off</td>
        <td>${chargingCount} of ${totalCount} major UK airports</td>
      </tr>
      <tr>
        <td colspan="2">Data last verified</td>
        <td>${escHtml(latestVerified)}</td>
      </tr>
    </tbody>
  </table>

  <!-- ── Visible widget body ── -->
  <div class="pm-body">

    <!-- Headline stat + sparkline -->
    <div class="pm-stat-row">
      <div class="pm-stat-left">
        <p class="pm-stat-label">Most expensive drop-off</p>
        <div class="pm-stat-val-wrap">
          <span class="pm-big" aria-label="${escHtml(dearestFee)} drop-off charge">${escHtml(dearestFee)}</span>
          <span class="pm-airport">${escHtml(dearestName)}</span>
        </div>
      </div>
      <div class="pm-spark" aria-hidden="true">${sparkSvg}</div>
    </div>

    <hr class="pm-divider">

    <!-- Secondary stats grid -->
    <div class="pm-grid">
      ${cheapestName && cheapestFee ? `<div>
        <p class="pm-stat-sm-label">Cheapest charge</p>
        <p class="pm-stat-sm-val pm-positive">${escHtml(cheapestFee)}</p>
        <p class="pm-stat-sm-sub">${escHtml(cheapestName)}</p>
      </div>` : ""}
      <div>
        <p class="pm-stat-sm-label">Airports charging</p>
        <p class="pm-stat-sm-val">${chargingCount} of ${totalCount}</p>
        <p class="pm-stat-sm-sub">UK airports</p>
      </div>
    </div>

    <!-- CTA link -->
    <div class="pm-cta">
      <a href="${escHtml(hubUrl)}" target="_blank" rel="noopener noreferrer">
        Compare all airports →
      </a>
    </div>

  </div><!-- /pm-body -->

  <!-- ── Attribution footer (always present) ── -->
  <div class="pm-footer">
    <span class="pm-source">
      Source: <a href="${escHtml(hubUrl)}" target="_blank" rel="noopener noreferrer">ParkMath</a>
      &mdash; verified UK airport fees
    </span>
    <a href="${escHtml(hubUrl)}" target="_blank" rel="noopener noreferrer"
       class="pm-attr-link" aria-label="Visit ParkMath for full data">
      parkmath.co.uk &rarr;
    </a>
  </div>

</div><!-- /pm-widget -->

<script>${RESIZE_SCRIPT}</script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800"
    }
  });
}

# MathFamily — Work Summary (2026-06-12)

Plain-language record of what was built, why, and its current state. Everything below is **merged to
`main` and live on `https://www.parkmath.co.uk`** unless noted. ParkMath-focused; RoamMath inherits the
shared-package changes but its app/content was not otherwise touched.

---

## 1. Monetization — affiliate activation (3 stages)

ParkMath went from *zero* affiliate revenue to a complete, honest, ASA/CMA-compliant booking surface.
The whole approach is built on the site's trust model: the price **ranking stays commission-blind**
(it comes from the airport's own published prices, never the affiliate), and every paid link is
clearly **"Ad"-labelled** with `rel="sponsored"`.

### Stage 1 — Affiliate activation (Holiday Extras)
- Turned on the dormant affiliate skeleton. **Holiday Extras** (AWIN merchant `3496`, publisher
  `2932035`) is the live merchant on every airport-parking page.
- Links are built in code (`buildAwinLink`) as `cread.php?awinmid=…&awinaffid=2932035&clickref=parkmath-<airport>`,
  so AWIN reporting shows **which airport** drives each click.
- Disclosure rewritten to pass UK ASA rules: leads with **"Ad"**, says **"earns"** (not the
  ASA-flagged "may earn"). Also fixed a separate site-wide "may earn" line in `SourcesBlock`.
- Holiday Extras' **siblings (Purple Parking, Airparks)** are the *same parent company* and lower-EPC,
  so they're kept in config but inactive — listing them as rival "options" would be misleading.

### Stage 2 — Two-route "Booking options" (parking pages)
- Replaced the single link with a **two-route block**: an **official airport** route (no Ad, equal
  weight) + an **elevated Holiday Extras** route (Ad chip, free-cancellation / no-code / best-price
  benefits, the compliant *"10% off, up to 25% at Gatwick"* line, a risk-reversal button).
- The HE click now **deep-links to its parking page** (`ued=…/airport-parking.html`).

### Stage 3 — Affiliate surface expansion (drop-off + lounge)
- The headline-traffic **drop-off** pages and the **lounge** pages earned nothing. Added a reusable,
  **responsive `HolidayExtrasCard`** (full card on desktop, one-line on mobile):
  - Drop-off pages → a parking cross-sell ("staying & parking?") + a quiet *"also: hotels · lounges ·
    transfers"* deep-link line.
  - Lounge pages → a real HE lounge CTA, replacing a dead Priority-Pass link that earned £0.
- Per-page attribution via `clickref=parkmath-<airport>-<surface>`. The now-dead old `AffiliateBlock`
  was removed.

**Reference for all of the above:** `docs/affiliate/` (HE/Purple Parking/Airparks welcome packs +
join-status/EPC), and the memory notes `awin-affiliate-ids` / `holiday-extras-affiliate-assets`.

---

## 2. SEO + website-code audit and fixes

A **7-dimension audit** (technical SEO, on-page, structured data, performance, GEO/AI, accessibility,
code+security) was run across the live site and the repo, then a "quick wins + P0" batch was shipped.

- **Audit report:** `docs/seo-audit/2026-06-12-seo-code-audit.md` (scorecard, prioritised findings,
  and a "do NOT touch — already excellent" list).
- **Verdict:** the site is genuinely well-built; the real gaps were canonical/OG, entity/price schema,
  and security headers.

### What shipped (all live + verified on production)
- **Self-referencing canonical tags + OpenGraph** on every page (fixes duplicate-URL risk; auto-adds `og:url`).
- **Security headers** on every response — **CSP**, `X-Frame-Options: DENY`, `nosniff`,
  `Referrer-Policy`, `Permissions-Policy`, **HSTS** (curl-verified live).
- **Organization** schema entity sitewide; **NewsArticle** now has the Google-required `image` +
  `author` + publisher logo.
- **Answer-first summaries** above the index tables (drop-off/parking/lounge) — better for ranking *and*
  AI-answer citation; **FAQ answers now cite the verified date + official source**.
- **Performance:** stopped preloading the unused mono font weights so the headline (LCP) font gets the
  preload budget.
- **Accessibility:** a skip-to-content link and a valid `/news` heading outline.
- **Titles** trimmed to ~60 chars; `next`/`react` deps **caret-pinned** (were `"latest"` — silent-major risk).

### Deferred (documented, not done) — P1/P2 backlog in the audit report
Offer/price schema, a CI pipeline, a couple of finer a11y fixes (`SegmentedControl` keyboard, count-up
`aria-live`), lounge-page depth, and ~24 P2 polish items (Sitelinks SearchAction, Airport entity,
`dateModified`/`speakable`, a JSON data export, global `:focus-visible`, error/`not-found` pages, a
shared `@mathfamily/partners` package, interlinking, etc.).

---

## 3. Tooling

- **Turborepo** floor raised `^2.5.0 → ^2.9.0` (resolved `2.9.16`) for faster scheduling + stable
  `turbo query`. Verified: `turbo run typecheck` (7/7) and `turbo run build` (2/2) pass.
- Earlier in the build-out: a **Cloudflare Web Analytics** seam replaced Vercel Analytics; an
  **AWIN MasterTag** seam exists in `SiteAnalytics` but ships **off** (set `NEXT_PUBLIC_AWIN_PUBLISHER_ID`
  to enable — not needed to earn commission).

---

## How it was built

Every change followed the same disciplined flow — **brainstorm → spec → plan → TDD implementation →
full-gate verification → deploy → live verification** — with specs in `docs/superpowers/specs/` and
plans in `docs/superpowers/plans/`. Schema/logic changes are unit-tested; metadata/headers are
verified on a Vercel preview and again on production.

## What's already done for you / what to know
- **Live now:** all three affiliate stages, the SEO batch (headers/schema/canonical confirmed live),
  and the turbo bump.
- **Env vars (already set in Vercel Production):** `NEXT_PUBLIC_SITE_URL=https://www.parkmath.co.uk`.
- **✅ Cloudflare analytics — FIXED (2026-06-12).** Root cause was that the `www`/apex DNS records were
  **"DNS only" (grey cloud)**, so traffic went straight to Vercel and Cloudflare's **Traffic** analytics
  never saw it. Both CNAMEs (`parkmath.co.uk` + `www`, → `…vercel-dns-017.com`) were flipped to
  **Proxied (orange cloud)** via the dashboard, and **SSL/TLS** set to **Automatic** (recommended;
  currently running **Full**, auto-upgrades toward Strict on the next origin scan — avoids a transient
  `526` vs. forcing Full-strict immediately). Verified live: both hosts now return `server: cloudflare`
  + a `cf-ray` header (London edge), apex still 308→`www` with no redirect loop, HSTS intact. **Traffic
  analytics populates under *Analytics & Logs → Traffic* within minutes** as visitors arrive — no code,
  no beacon, no env var. *(Dashboard note: the Cloudflare SPA wouldn't load while the MetaMask browser
  extension's SES lockdown was active — had to disable MetaMask to reach the dashboard.)*
- **Cloudflare MCP installed globally** — `cloudflare-graphql` (GraphQL Analytics) at user scope in
  `~/.claude.json`; needs a one-time Cloudflare OAuth on first use (restart Claude Code to load it).
- **To verify earnings:** click a live "Pre-book" CTA and confirm the click lands in your AWIN
  dashboard against publisher `2932035` (look at the **Click Report** for the `parkmath-<airport>` refs).
- **News routine (local):** the weekly `/news-watch` launchd job isn't installed yet —
  `cp docs/launchd/com.mathfamily.news-sweep.plist ~/Library/LaunchAgents/ && launchctl load …`.

## Likely next steps (when you're ready)
- **Per-airport / highest-commission routing** — e.g. Heathrow → "Heathrow Airport Parking" (AWIN EPC
  ~£1.48, ~9× Holiday Extras) once it leaves *Pending*. The data model already supports it.
- The licensed **Holiday Extras logo** on the affiliate cards (text-only for now).
- The **SEO P1/P2 backlog** above (Offer schema + CI are the highest-value next picks).
- **RoamMath** parity (it inherits the shared packages; its app/content come later).

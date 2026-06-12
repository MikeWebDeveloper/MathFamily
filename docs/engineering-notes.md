# Engineering notes

## esbuild `build()` deadlocks on this volume — no vitest config files

**Symptom:** `vitest run` hangs forever with zero output (not even the banner).

**Root cause (diagnosed 2026-06-10):** esbuild's `build()` API deadlocks on
`/Volumes/TB4 Workstation` (external APFS, mounted `noowners`). `transform()` works
fine; `build()` — which walks the filesystem — never returns. Vitest/Vite only call
`build()` to bundle `vitest.config.*` files, so:

- **No config file → vitest works perfectly** (verified: full suite in ~300 ms).
- **Any `vitest.config.{ts,js,mts}` → permanent hang**, regardless of content.

Minimal repro: a one-test project with any vitest config hangs on this volume and
passes on the internal disk or without the config.

**Conventions for this repo (do not add vitest config files):**

- Packages keep tests in `tests/**/*.test.ts(x)` — vitest's default include pattern
  finds them without configuration.
- `packages/ui` needs jsdom: declare it per test file with a docblock first line:
  `// @vitest-environment jsdom` (jsdom stays a devDependency).
- `apps/parkmath` must not let vitest pick up Playwright's `e2e/*.spec.ts`:
  its test script is `vitest run tests` (positional filter limits vitest to `tests/`).

**Watch out elsewhere:** anything that bundles configs via esbuild `build()` may hang
the same way on this volume. Next.js (SWC) and Tailwind v4 (oxide) use different
toolchains and are expected to be fine. If Playwright config loading ever hangs,
suspect the same cause.

A possible system-level fix is enabling ownership on the volume
(`sudo diskutil enableOwnership "/Volumes/TB4 Workstation"`) — unverified, requires
sudo, and the no-config convention makes it unnecessary for this repo.

## Analytics

Live analytics is **Cloudflare Traffic (Zone) analytics** — automatic because the domain is
now **proxied through Cloudflare** (orange cloud). **Done 2026-06-12:** the `parkmath.co.uk`
apex + `www` CNAMEs (→ Vercel, `…vercel-dns-017.com`) were flipped from *DNS only* to
**Proxied** in the Cloudflare dashboard, and **SSL/TLS** set to **Automatic** (running Full,
auto-upgrades toward Strict on the next origin scan — Automatic avoids a transient `526` vs.
forcing Full-strict). Verified live: both hosts return `server: cloudflare` + a `cf-ray`
header, apex still 308→`www` with no redirect loop. Data appears under **Cloudflare →
Analytics & Logs → Traffic** — no code, no beacon token, no env var.
*(Gotcha: the Cloudflare dashboard SPA won't load while the MetaMask extension's SES lockdown
is active — disable MetaMask to reach it.)*

**Web Analytics beacon — installed 2026-06-13.** This is the second analytics product
(page views + unique visitors + per-path Core Web Vitals/RUM), separate from the edge Traffic
analytics above. Cloudflare's *automatic* RUM injection does **not** fire on the Vercel origin
(the beacon never appeared in the live HTML even with the zone proxied and RUM set to plain
"Enable"), so it's installed **manually**: `<SiteAnalytics>` (`packages/ui/src/site-analytics.tsx`)
renders the `beacon.min.js` tag, and ParkMath's layout passes the **public** site token via the
`cfToken` prop (`apps/parkmath/app/layout.tsx`). `NEXT_PUBLIC_CF_BEACON_TOKEN` still overrides it
if set in Vercel. No cookies → no consent banner. Confirmed live: the beacon tag is in the HTML
and CSP-allowed (`script-src` includes `static.cloudflareinsights.com`).

> **Gotcha:** in Cloudflare → Web analytics → *Manage site*, RUM must be **"Enable"**, not
> "Enable, excluding visitor data in the EU" — the latter suppresses the beacon for EU
> visitors, so a UK site (≈96% UK/EU) records **zero**. Cloudflare auto-added the proxied site
> with the EU-excluded default, which is why it read 0 until flipped.

### Later: self-hosted Plausible
To add Plausible alongside/instead of Cloudflare, add its `<script defer data-domain="…"
src="https://<your-plausible-host>/js/script.js">` inside `<SiteAnalytics>` behind a
`NEXT_PUBLIC_PLAUSIBLE_DOMAIN` env — no layout changes. Self-host via `docker compose`
(Plausible CE + ClickHouse + Postgres) behind a reverse proxy, or a one-click Docker PaaS
(Coolify/Dokploy). Decision deferred.

## News-watch routine

Gathers official airport updates into `packages/data/datasets/parkmath/news.json` via a PR.
- Sources: `tools/freshness/news-sources.json` (curated official news/ops URLs), merged into
  the shared `watchlist.json` as `news:<airport>` entries.
- Agent: the `/news-watch` skill, run headless by `tools/freshness/run-agent.sh news-sweep`.
- Cadence: weekly sweep via launchd. Install:
  `cp docs/launchd/com.mathfamily.news-sweep.plist ~/Library/LaunchAgents/ && launchctl load ~/Library/LaunchAgents/com.mathfamily.news-sweep.plist`
- Manual run: `tools/freshness/run-agent.sh news news:bristol` (targeted) or
  `tools/freshness/run-agent.sh news-sweep` (full). Add `PRINT_CMD=1` to dry-run.
- Output: a PR on `news/<run-id>` touching only `news.json`, with a NEEDS-HUMAN block. Review
  and merge to publish.
- Cost: extraction can use Gemini (`gemini-2.5-flash` via `tools/gemini-pick-model.sh`).

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

Live analytics is **Cloudflare Web Analytics**, injected by `<SiteAnalytics>`
(`packages/ui/src/site-analytics.tsx`) when `NEXT_PUBLIC_CF_BEACON_TOKEN` is set in the
Vercel project env. No cookies → no consent banner. Get the token from the Cloudflare
dashboard → Web Analytics → add a site (beacon mode, since we're served from Vercel, not
proxied through Cloudflare).

### Later: self-hosted Plausible
To add Plausible alongside/instead of Cloudflare, add its `<script defer data-domain="…"
src="https://<your-plausible-host>/js/script.js">` inside `<SiteAnalytics>` behind a
`NEXT_PUBLIC_PLAUSIBLE_DOMAIN` env — no layout changes. Self-host via `docker compose`
(Plausible CE + ClickHouse + Postgres) behind a reverse proxy, or a one-click Docker PaaS
(Coolify/Dokploy). Decision deferred.

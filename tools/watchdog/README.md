# watchdog — ParkMath site + affiliate-deeplink health check

Daily check that every live parkmath.co.uk route is up and the Holiday Extras deeplinks are intact.

## Run
```bash
node tools/watchdog/check.mjs            # full check against https://parkmath.co.uk
node tools/watchdog/check.mjs --json     # machine-readable summary (incl. reportPath on failure)
node tools/watchdog/check.mjs --no-fetch # structural deeplink checks only (no network)
node tools/watchdog/check.mjs --no-plumbing # skip the measurement checks (section 3)
node tools/watchdog/check.mjs --base https://staging.example  # alternate base
node tools/watchdog/check.mjs --roammath-base https://preview.example  # alternate RoamMath base
node --test tools/watchdog/*.test.mjs    # unit tests (pure logic in lib.mjs)
```
Exit `0` = all green; exit `1` = one or more failures. On failure the runner writes
`docs/reports/watchdog-<date>.md` (the `watchdog` skill uses it as the GitHub issue body).

## What it checks
1. **Pages up** — GET every hub + per-airport drop-off / parking / parking-duration / lounge + news
   page; expects `200` + real HTML.
2. **Deeplink integrity** — every link `buildAwinLink()` can emit is validated *structurally* against
   the AWIN contract (mid / affid / clickref / ued), and the distinct **destination** landing pages
   (holidayextras.com) are probed for liveness.
3. **Measurement plumbing**: the pipes that broke silently for 1–2 weeks each in Nov 2026.
   | Check | Fails when |
   |---|---|
   | `cf-beacon-parkmath`, `cf-beacon-roammath` | the home page HTML has no Cloudflare Web Analytics beacon |
   | `umami-host` | the Umami script the ParkMath page loads (read from the HTML, not hard-coded) doesn't answer |
   | `awin-token` | the AWIN Publisher API rejects `AWIN_API_TOKEN` from `tools/awin/.env` |
   | `umami-auth` | Umami's login rejects the credentials in `tools/reels/analytics.env`, or can't be reached |

   Each failure in the report carries a one-line fix. `awin-token` and `umami-auth` are **skipped**
   (not failed) when their `.env` file isn't on the machine, such as CI or a fresh worktree.

## SAFETY
Never requests `awin1.com/cread.php` / `awclick.php`. Firing the click tracker would register phantom
affiliate clicks and risk AWIN compliance. The watchdog only does structural validation + merchant
**destination** probing. The `awin-token` check calls the read-only Publisher **API**
(`api.awin.com/accounts`), which is a different host from the tracker. Secrets are sent only in a header
or body to their own service and never appear in the console output or the report (the report becomes a
GitHub issue on a public repo).

## Files
- `lib.mjs` — pure logic (routes, `buildAwinLink` port, deeplink validation, report). Unit-tested.
- `lib.test.mjs` — `node:test` unit tests (`node --test tools/watchdog/*.test.mjs`).
- `check.mjs` — the network runner (probes, throttling, exit code, report writing).

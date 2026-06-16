# watchdog — ParkMath site + affiliate-deeplink health check

Daily check that every live parkmath.co.uk route is up and the Holiday Extras deeplinks are intact.

## Run
```bash
node tools/watchdog/check.mjs            # full check against https://parkmath.co.uk
node tools/watchdog/check.mjs --json     # machine-readable summary (incl. reportPath on failure)
node tools/watchdog/check.mjs --no-fetch # structural deeplink checks only (no network)
node tools/watchdog/check.mjs --base https://staging.example  # alternate base
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

## SAFETY
Never requests `awin1.com/cread.php` / `awclick.php`. Firing the click tracker would register phantom
affiliate clicks and risk AWIN compliance. The watchdog only does structural validation + merchant
**destination** probing.

## Files
- `lib.mjs` — pure logic (routes, `buildAwinLink` port, deeplink validation, report). Unit-tested.
- `lib.test.mjs` — `node:test` unit tests (`node --test tools/watchdog/*.test.mjs`).
- `check.mjs` — the network runner (probes, throttling, exit code, report writing).

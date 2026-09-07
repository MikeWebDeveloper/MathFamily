# ParkMath daily data check — 2026-09-07

## STEP 1 — News watch (sweep)

Ran `watchdog:news`. No changed official-newsroom fingerprints. 6 pages returned
HTTP 403 as they routinely do (Edinburgh, Belfast Int'l, Belfast City, Bournemouth,
Bristol, Newcastle newsrooms). **No news items added, no news PR.**

## STEP 2 — Affected records

None — no announced fee/price change surfaced by STEP 1.

## STEP 3 — Freshness re-verify (ParkMath only)

In scope: ParkMath parking/lounge records with `verifiedAt` > 46 days, the standing
hard-blocked targets, plus lounges:birmingham (89d). eSIM/roaming skipped (weekly job).
London City drop-off and priority-pass were re-verified 2026-09-04 (3d) — still fresh,
not re-checked.

### Re-verified against the airport's own page — unchanged (verifiedAt → 2026-09-07)

parking: gatwick, stansted (gate), newcastle, liverpool, teesside, prestwick,
aberdeen, belfast-international, exeter.

### Changed

| Record | Field | Old | New | Source |
| --- | --- | --- | --- | --- |
| parking:stansted | prebook "from" (8-day Long Stay) | £71.99 | £59.99 | stanstedairport.com/parking/long-stay/ |

parking-tariffs.json version 1.3.0 → 1.3.1.

### Could not verify — value kept, verifiedAt NOT bumped (NEEDS-HUMAN)

- parking:birmingham — birminghamairport.co.uk Cloudflare-blocked on every rung.
- parking:leeds-bradford — prices behind a JS accordion; no rung expands it.
- lounges:birmingham — airport page blocked, aspirelounges.com operator page 403s.

## Result

One PR: `freshness/2026-09-07` — 1 parking value change + 9 verifiedAt bumps,
3 records flagged for human verification.

# Watchdog stability notes — 2026-06

A live bootstrap followed by a back-to-back re-run of the P4 freshness watchdog
flagged 8 pages as "changed" with no real price change. Their normalised content
was unstable run-to-run. Per the plan's Task 7 Step 2 contract, each volatile page
must be made **stable** (targeted normaliser rule) or marked **unwatchable**.

## Investigation method

For each URL: fetched twice via `curl -s --max-time 40 "https://r.jina.ai/<url>"
-H "X-Return-Format: text"`, normalised both via `normalizeText` (`src/normalize.ts`),
and diffed. Where back-to-back fetches were identical, re-fetched after a time gap to
catch slow rotation.

## Root cause found: live header wall-clock

Three airport sites share the "Regional & City Airports" template, which injects a
**live HH:MM wall-clock** as a standalone line in the header nav (between
"Special Assistance"/"Assisted Travel" and "Car Parking"). It ticks every minute,
so any two fetches more than 60s apart produce different normalised content. This is
not a price and never co-occurs with a currency symbol or band label.

**Decision: STRIP (shared, cheap, safe).** Added `STANDALONE_CLOCK` rule to
`src/normalize.ts`: a line whose *entire trimmed content* is a clock token
(`HH:MM` or `HH:MM:SS`, validated 00:00–23:59) is dropped in the per-line filter.
Anchored to the full line, so inline times ("Open 09:00 to 17:00", "Last entry 14:30")
are untouched. Covered by TDD in `tests/normalize.test.ts`:
- equality test: same page at 23:15 vs 09:02 normalises EQUAL;
- guard tests: a real £4.00→£6.00 change still differs; inline opening-hours times,
  band labels ("0 - 10 minutes"), and prices are all retained.

## Per-URL decisions

| URL | Cause | Decision |
| --- | --- | --- |
| https://exeter-airport.co.uk/car-parking/ | Live header HH:MM wall-clock | **Strip** (STANDALONE_CLOCK rule) |
| https://www.bournemouthairport.com/car-parking/ | Live header HH:MM wall-clock | **Strip** (STANDALONE_CLOCK rule) |
| https://www.norwichairport.co.uk/car-parking/ | Live header HH:MM wall-clock | **Strip** (STANDALONE_CLOCK rule) |
| https://www.belfastairport.com/car-parking/drop-off-zone | No reproducible volatility in back-to-back or time-separated fetches; original flip was a transient r.jina markdown/JS-injection one-off | **Confirm via clean re-bootstrap** (no strippable token; transient) |
| https://www.belfastcityairport.com/Parking/Drop-Off-and-Pick-Up | As above (transient; rotating "Travel Update" banner carries a date already handled by DATE_PATTERNS) | **Confirm via clean re-bootstrap** |
| https://www.newcastleairport.com/car-parking/pick-up-drop-off/ | As above (transient) | **Confirm via clean re-bootstrap** |
| https://www.norwegian.com/en/booking/booking-information/optional-charges/ | As above (long JS page; no reproducible token) | **Confirm via clean re-bootstrap** |
| https://www.lufthansa.com/gb/en/baggage | As above (JS-heavy page; no reproducible token) | **Confirm via clean re-bootstrap** |

For the 5 "confirm" pages, the volatility did not reproduce in back-to-back or
time-separated fetches, so there is no clearly-identifiable token to strip. The
authoritative oracle is the back-to-back clean re-bootstrap: bootstrap run +
stability run, both must report `changed: []`. Any page that flips again on the
second run is then marked unwatchable (its domain added to `UNWATCHABLE_DOMAINS`
in `src/watchlist.ts`; the weekly sweep re-verifies those with deeper transports).

## Transient flip observed and resolved: Manchester

The first post-fix back-to-back run (after the clock fix) flipped ONE page that was
**not** among the original 8:
`https://www.manchesterairport.co.uk/parking/pick-up-and-drop-off/`
(`drop-off:manchester`). Investigation: back-to-back and 3x repeated fetches were
byte-identical; the watched drop-off prices (£5, £6.40, £25) are stable; the only
`£` values that could plausibly move are the dynamic "From £X" cross-sell promos in
the bottom "Our other airport car parks" block (£65 / £89.99 / £85), which also held
steady across repeated fetches. No strippable non-price token exists, and the promo
values are genuine `£` content the normaliser must never eat. Rather than disable the
whole `manchesterairport.co.uk` domain (which would also drop the stable
`parking:manchester` URL), it was treated as **transient** and re-confirmed by a fresh
clean re-bootstrap. It did **not** flip on the subsequent back-to-back run, confirming
the transient diagnosis. No code change needed for Manchester.

## Re-bootstrap result (final, after clock fix)

After `echo '{}' > hashes.json` and two `pnpm watchdog` runs (perl alarm 1500s each):

- Run 1 (bootstrap): `{"changed":[],"errors":[]}` — 90 URLs seeded, 0 pending.
- Run 2 (stability):  `{"changed":[],"errors":[]}` — back-to-back stability proven;
  all 8 original unstable pages (3 clock pages + 5 transient) stayed stable, no new
  flippers.

Committed `hashes.json` is this clean bootstrap: 90 entries, 0 `pendingSince`.

---
name: awin-digest
description: Weekly AWIN performance + merchant-status digest for ParkMath. Reads tools/awin (read-only), summarises clicks/earnings by airport + advertiser, flags pending→joined flips, and writes a ≤10-line digest to docs/reports/awin-<date>.md. Use when asked to run the AWIN weekly digest.
---

# AWIN-digest routine

Produces a short, **human-reviewed** weekly digest of AWIN affiliate performance and
merchant-join status, written to `docs/reports/awin-<YYYY-MM-DD>.md`. It runs the existing
first-party, read-only `tools/awin` client — it **never** edits affiliate ranking, **never**
publishes, and **never** touches `partners.json`. When a higher-EPC merchant becomes joinable
it emits a ready-to-paste `partners.json` ACTIVATE snippet *as text in the digest* for Mike to
apply by hand.

Invoked headless: `run-agent.sh awin-digest` → `claude -p "/awin-digest"`; launchd **Mon 08:00**.

## Hard rules (read-mostly, review-file only)
- **Read-only.** Only run `tools/awin` (it issues `GET`s only) and read `partners.json` for shape.
  Never edit `partners.json`, affiliate ranking, `partners.ts`, or any code/data — the only file
  you write is `docs/reports/awin-<YYYY-MM-DD>.md`.
- **Never auto-activate.** A merchant flipping to `joined` only ever produces a *suggested* snippet
  in the digest under `NEEDS-HUMAN`. Mike reviews and applies it himself. Nothing auto-publishes.
- **No affiliate links anywhere.** This digest reports status + earnings; it never contains
  affiliate / `cread.php` links.
- **Token-graceful.** If `tools/awin/.env` lacks the token (`AWIN_API_TOKEN`), write the one-line
  digest `AWIN token not configured` and exit 0 — do not fail the run.
- **Never invent numbers.** Every figure in the digest comes from `tools/awin` output. If a command
  errors (401/429/network), note it in one line rather than guessing.
- **Bounded output: ≤10 lines**, one file, no PR.

## Steps

1. **Preflight the token.** Confirm `tools/awin/.env` exists and contains a non-empty
   `AWIN_API_TOKEN`. If it is missing or empty, write `docs/reports/awin-<YYYY-MM-DD>.md` with the
   single line `AWIN token not configured` and stop (exit cleanly). Use today's date
   (`date +%F`, Europe/London) for `<YYYY-MM-DD>`.

2. **Pull merchant status + flips.** From the repo root:
   ```bash
   node --env-file=tools/awin/.env tools/awin/awin.mjs programmes --watch --json
   ```
   This diffs joined+pending against the last snapshot and returns `{ changes, snapshot }`. Each
   change is `{ id, name, from, to }`. Note any `pending → joined` flips (and any other relationship
   changes). `--watch` updates `tools/awin/.awin-programmes.json` — that snapshot churn is expected;
   do not commit it.

3. **Pull the week's transactions.** Compute the window — `<until>` = today, `<since>` = today − 7
   days — and run:
   ```bash
   node --env-file=tools/awin/.env tools/awin/awin.mjs transactions --since <since> --until <until> --json
   ```
   If you prefer the pre-aggregated view, run the same command **without** `--json` for the
   human-readable "By airport" / "By advertiser" / totals breakdown. Earnings are aggregated by
   airport from the `parkmath-<airport>` clickRefs and by advertiser.

4. **Summarise.** From the transactions output, take: total commission + sales + count for the week,
   the top airports by commission (`parkmath-<airport>` clickRefs), and the top advertisers. From the
   programmes output, list any relationship changes, marking `pending → joined` flips clearly.

5. **Activation trigger (higher-EPC merchants).** If a **higher-EPC** merchant flipped to `joined`
   this week, append a ready-to-paste ACTIVATE snippet to the digest under a `## NEEDS-HUMAN`
   heading. Watch list (by `awinmid`, with rough EPC for prioritising):
   - **Heathrow Airport Parking** — `awinmid 2365`, EPC ~£1.48
   - **APH** — `awinmid 1478`
   The snippet must match the real `apps/parkmath/lib/partners.json` shape — a partner entry keyed by
   slug, flipping `active` to `true`, e.g.:
   ```jsonc
   // ACTIVATE — paste into apps/parkmath/lib/partners.json → "partners", review before committing
   "heathrow-airport-parking": {
     "name": "Heathrow Airport Parking", "awinmid": "2365", "active": true,
     "landingUrl": "https://...",
     "products": { "parking": { "url": "https://...", "label": "parking" } }
   }
   ```
   Leave `landingUrl` / product `url`s as `https://...` placeholders for Mike to fill — never fabricate
   URLs. Do **not** edit `partners.json` yourself; the snippet is text only. If no higher-EPC merchant
   flipped, omit the `NEEDS-HUMAN` section entirely.

6. **Write the digest** to `docs/reports/awin-<YYYY-MM-DD>.md` (≤10 lines, excluding any
   `NEEDS-HUMAN` snippet block). Keep it answer-first and scannable — totals line, top airports, top
   advertisers, any flips. Create `docs/reports/` if it does not exist.

## OUTPUT — `docs/reports/awin-<YYYY-MM-DD>.md`

A digest of **≤10 lines** (a fenced ACTIVATE snippet under `## NEEDS-HUMAN` may follow and does not
count toward the 10). Shape:

```md
# AWIN digest — 2026-06-13 (week 2026-06-06 → 2026-06-13)
- Totals: £X.XX commission · £Y.YY sales · N transactions
- Top airports: heathrow £A.AA (n) · manchester £B.BB (n) · gatwick £C.CC (n)
- Top advertisers: Holiday Extras £D.DD (n) · ...
- Status changes: Purple Parking pending → joined ✅ · (or "none")
- Flags: <higher-EPC join trigger, or "no activation triggers">
```

Token-missing case — the entire file is one line:

```md
AWIN token not configured
```

## Guardrails recap
- Read-only against `tools/awin`; the only write is `docs/reports/awin-<YYYY-MM-DD>.md`.
- Never edit `partners.json` / affiliate ranking — ACTIVATE snippets are suggestions for a human.
- No affiliate links in the digest. Nothing auto-publishes; a human reviews the committed file.
- Missing token → one line `AWIN token not configured`, exit 0. Never invent figures.

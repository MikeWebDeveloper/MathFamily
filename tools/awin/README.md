# Awin client (`tools/awin`)

A small, **first-party, read-only** client for the Awin Publisher API — built so Claude Code
(or you) can pull affiliate data from the terminal without any third-party MCP server or browser
middleware.

## Why this and not a third-party "Awin MCP"

Installing someone else's MCP server means running their `npm install` (arbitrary code + their whole
dependency tree) **and** handing it your Awin token. This client avoids all of that:

- **Zero dependencies.** Pure Node (`fetch`, `--env-file`). Nothing to `npm install`.
- **Read-only.** Only HTTP `GET`s to `api.awin.com` / `productdata.awin.com`. It never modifies your account.
- **Your token never leaves your machine** and is sent only as an `Authorization: Bearer` header —
  never in a URL or a log line. It lives in `tools/awin/.env` (gitignored), not in source.
- **~250 lines you can read end-to-end** ([lib.mjs](lib.mjs) + [awin.mjs](awin.mjs)), fully unit-tested.

## Setup

1. `cp tools/awin/.env.example tools/awin/.env`
2. Get your token at <https://ui.awin.com/awin-api> ("Show my API token") and paste it into `.env`.
3. (Feeds only) Get a Create-a-Feed API key from Awin → Toolbox → Create-a-Feed → `AWIN_FEED_API_KEY`.

`.env` is already gitignored. The token is personal and account-wide, so treat it like a password —
but this tool only reads.

## Usage

Run everything through Node's `--env-file` so the token loads from `.env`:

```bash
node --env-file=tools/awin/.env tools/awin/awin.mjs <command>
```

| Command | What it does |
|---|---|
| `accounts` | List your publisher accounts → find your `AWIN_PUBLISHER_ID`. |
| `programmes --status pending` | Merchants you're `joined`/`pending`/`suspended`/`rejected`/`notjoined` with. |
| `programmes --watch` | Snapshots joined+pending and reports flips since last run (e.g. **Purple Parking: pending → joined ✅**). |
| `transactions --since 2026-06-01 [--until 2026-06-30]` | Earnings, aggregated **by airport** (from the `parkmath-<airport>` clickRefs) and by advertiser. |
| `feed list` | List available product feeds (needs `AWIN_FEED_API_KEY`). |
| `feed download --url "<create-a-feed url>" [--out file]` | Download a product feed export. |

Add `--json` to any command for raw machine-readable output.

### Examples

```bash
# Find your publisher id
node --env-file=tools/awin/.env tools/awin/awin.mjs accounts

# Has Purple Parking / Airparks / Heathrow Airport Parking gone live yet?
node --env-file=tools/awin/.env tools/awin/awin.mjs programmes --watch

# Last month's earnings by airport
node --env-file=tools/awin/.env tools/awin/awin.mjs transactions --since 2026-05-01 --until 2026-05-31
```

## How Claude Code uses it

Because it's a CLI, Claude invokes it via `Bash` only when needed — so the token exists for the
lifetime of one command, not loaded into every session. A typical loop: run `programmes --watch`,
and when a merchant flips to `joined`, update the per-airport routing in
[`apps/parkmath/lib/partners.ts`](../../apps/parkmath/lib/partners.ts) to point that airport at the
higher-EPC merchant.

## Notes / limits

- Awin throttles to **20 API calls/minute**. The `transactions` command auto-splits ranges into the
  API's **31-day max** windows and paces itself.
- Affiliate **link generation needs no API** — links are built client-side by `buildAwinLink`
  (`cread.php?...&clickref=parkmath-<airport>`). This client is for **data** (status, earnings, feeds).

## Tests

```bash
node --test tools/awin/lib.test.mjs
```

Covers date/range validation, URL builders (token-free), clickRef→airport parsing, transaction
aggregation, programme diffing, and feed-CSV parsing. The pure logic is tested; live HTTP is not
(no token in CI).

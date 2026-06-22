# Affiliate-click counter

The `/go/[airport]/[target]` redirect already records one structured line per affiliate-CTA click:

```json
{"event":"parkmath_affiliate_click","airport":"southend","target":"parking","surface":"hub","ts":"…"}
```

That event was **logged but never counted**. This tool turns the log stream into a durable, countable
daily **clicks-by-airport-by-surface** snapshot — the visible bottom of the booking funnel.

## Use

```bash
# From piped/saved Vercel runtime logs (no credentials needed):
vercel logs <deployment-url> | node tools/affiliate/clicks.mjs --stdin
node tools/affiliate/clicks.mjs --file logs.txt

# Pull from the Vercel runtime-logs API (read-only; needs a token):
cp tools/affiliate/.env.example tools/affiliate/.env   # add VERCEL_TOKEN
node --env-file=tools/affiliate/.env tools/affiliate/clicks.mjs --pull

# Raw JSON / skip writing a snapshot:
node tools/affiliate/clicks.mjs --file logs.txt --json --no-snapshot
```

Snapshots land in `tools/affiliate/snapshots/clicks-YYYY-MM-DD.json` (gitignored). Read-only: the tool
only ever GETs. No third-party scripts, no cookies, no PII — the click event itself carries none.

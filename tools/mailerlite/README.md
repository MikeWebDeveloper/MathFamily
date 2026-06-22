# MailerLite flush / import

`flush.mjs` — one-command import of captured ParkMath signups into MailerLite. Zero deps
(Node ≥ 18). Idempotent (MailerLite upserts subscribers).

## When you'd run it

Until the MailerLite API token exists, the live site captures signups **durably without it**:
the `/api/subscribe` route persists every consented signup to the fail-safe store —

1. a **Resend email** to the Company signup inbox (`SIGNUP_NOTIFY_TO`), and
2. a structured **`SIGNUP|<email>|<source>|<ts>`** line in the Vercel runtime logs.

Nothing is lost. Once the token lands, run this tool once to backfill everything captured in
that window, then live signups flow straight through (the route auto-subscribes when
`MAILERLITE_API_TOKEN` + `MAILERLITE_GROUP_ID` are set in Vercel).

## Recover the list, then flush

Build an `emails.txt` from either durable source — the tool accepts plain emails, CSV rows, or
raw `SIGNUP|…` log lines (one per row), and de-dupes:

```bash
# from the signup inbox: export/forward the signups, or paste addresses, one per line
# from Vercel logs:
vercel logs math-family-parkmath --token "$(cat ~/.config/company/vercel-token)" \
  | grep '^SIGNUP|' > emails.txt

node tools/mailerlite/flush.mjs emails.txt          # imports into the "ParkMath" group
node tools/mailerlite/flush.mjs --dry-run emails.txt # parse + de-dupe only, no API calls
```

## Token & group

- Token: `~/.config/company/mailerlite-token` (not committed) — or `MAILERLITE_API_TOKEN` env.
- Group: `--group <id>`, or `MAILERLITE_GROUP_ID` env, or resolved/created by name
  (`--group-name`, default `ParkMath`).

## Wiring the live site (when the token arrives)

Set in Vercel (project `math-family-parkmath`, production) and redeploy:

- `MAILERLITE_API_TOKEN` — the MailerLite API token
- `MAILERLITE_GROUP_ID` — the `ParkMath` group id (the flush tool prints it, or it's in the
  MailerLite dashboard)

The durable email sink stays on regardless (belt-and-braces), so even post-token a signup is
captured twice.

# tools/social — marketing review artifacts

Everything here is **generated, reviewed, then pasted by hand**. Nothing auto-publishes.

- **content-factory** (`tools/freshness/run-agent.sh content-factory`, launchd **Sun 09:00**) writes:
  - `queue-<date>.json` — a week of social posts → review, paste into Postiz
  - `email-digest-<date>.md` — MailerLite weekly-digest body
- **forum-scout** (`run-agent.sh forum-scout`, **on-demand**) reads `forum-leads.md` (your pasted
  F5Bot alerts / thread URLs) and writes `forum-drafts-<date>.md`.

The dated outputs and your `forum-leads.md` are **gitignored** (transient, reviewed locally). See
`forum-leads.example.md` for the lead format, and `docs/marketing/` for the copy templates the
skills follow. The rules these skills enforce: verified numbers only, `parkmath.co.uk` in every
post, and **never** an affiliate link in social/forum copy.

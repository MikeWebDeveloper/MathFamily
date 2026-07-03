# ParkMath — social media accounts

Live social presence for **ParkMath** (`parkmath.co.uk`). Launched **15 June 2026**.

**Handle convention:** `parkmathuk` everywhere. (Plain `parkmath` was taken on Bluesky, so the
`...uk` suffix is the canonical handle across all platforms — match it on any new platform.)

> No passwords/credentials in this file. Accounts are managed by Mike. IG/Threads were set up via
> Google (Gmail) login; if mobile Google-login fails, set a password via "Forgot password" and log
> in with email + password.

## Accounts

| Platform | Handle | Profile URL |
|---|---|---|
| X / Twitter | `@parkmathuk` | https://x.com/parkmathuk |
| Instagram | `@parkmathuk` | https://www.instagram.com/parkmathuk/ |
| Threads | `@parkmathuk` | https://www.threads.com/@parkmathuk |
| Bluesky | `parkmath.bsky.social` | https://bsky.app/profile/parkmath.bsky.social |
| Pinterest | ParkMath (business) | board: "UK Airport Parking & Drop-Off Costs" |

- Bluesky handle changed 2026-06-25: the original `parkmathuk.bsky.social` is DEAD (its Gmail got blocked). The live account is now **`parkmath.bsky.social`** — connected to Buffer. Update any old DID reference; the old `did:plc:caypcclwj76rg32rxnvut7d7` belonged to the dead handle.
- Scheduling stack: **Buffer is the ONLY stack** (free tier, 3 channels) — auto-posts X + Threads + Bluesky via its MCP. **Metricool is dropped** (Mike's call 2026-06-25). Bluesky hard limit = **300 chars** (trim copy); Threads ≤500; X ≤240. IG/Pinterest/TikTok are **deferred** (not in the daily stack) until a free no-paste path exists.
- **Daily automation (live 2026-06-25):** hermes cron job `parkmath-daily-social` fires **daily 07:00 UK** → runs the `/parkmath-daily-social` skill headless → reads the verified datasets + ledger → generates a fresh deduped batch → schedules straight into Buffer to **auto-publish** for X/Threads/Bluesky → logs to `ledger.jsonl` → self-verifies. Idempotent (skips any channel/day already at ≥2 posts). Wrapper: `~/.hermes/scripts/parkmath-daily-social.sh`; skill: `apps/.../.claude/skills/parkmath-daily-social/`.
- Threads handle always mirrors the Instagram handle (same Meta account).

## Bios in use (keep consistent on new platforms)

- **X:** `Verified UK airport drop-off fees, parking prices & lounge costs 🅿️ Every major airport. Official sources. Free. parkmath.co.uk`
- **Instagram:** `Verified UK airport costs 🅿️ Drop-off fees · Parking · Lounges. Every major airport. Official sources. Free.`

## Launch posts (15 Jun 2026) — first post on each platform

Copy lives in [`docs/marketing/launch-social-first-posts.md`](../../docs/marketing/launch-social-first-posts.md).

| Platform | Launch post URL |
|---|---|
| Bluesky | https://bsky.app/profile/parkmathuk.bsky.social/post/3moebpfsp4s27 |
| Threads | https://www.threads.com/@parkmathuk/post/DZn1l29iJ5o |
| Instagram | https://www.instagram.com/p/DZn5_nfjPXG/ (drop-off scoreboard graphic) |
| X / Twitter | https://x.com/parkmathuk (1 post — the launch text) |
| Pinterest | Pin "UK Airport Drop-Off Charges 2026 — and the Free Alternative at Each One" → links to `parkmath.co.uk/drop-off-charges` |

All five verified publicly visible (logged-out) on 15 Jun 2026.

## Notes

- **No affiliate links in any social post** — site is presented as an independent source
  (see content-factory hard rules and `tools/social/README.md`).
- Posting is **automated via Buffer** (see daily-automation note above) — no manual paste. The old direct-Bluesky cron posters (`bluesky-poster-*`, dead `parkmathuk.bsky.social` handle) are **paused** to avoid double-posting; Buffer owns Bluesky on the live `parkmath.bsky.social`.
- Pinterest pins are slow-burn (search-driven); don't pay to promote early — let pins index organically.

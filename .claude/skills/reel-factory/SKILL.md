---
name: reel-factory
description: Generate a week of ParkMath vertical reels (script + voice-over + MP4) from live datasets as review artifacts a human approves before posting. Use when asked to run the reel factory / generate the weekly reel batch.
---

# Reel-factory routine

Generates a weekly batch of **on-brand vertical reels** (TikTok/IG/FB) from the live ParkMath
datasets, as **review artifacts** in `tools/reels/review/<date>/` — Mike watches and posts manually.
Read-only on datasets; **never** modifies code, ranking, or any dataset; **never** auto-publishes.

## Hard rules (non-negotiable)
- **Verified numbers only.** Every figure comes from a dataset record; never invented or rounded for
  effect. If a slot has no verified figure, skip it — never fabricate (the generator already enforces this).
- **`parkmath.co.uk` in every reel; NO affiliate/merchant link, ever** (the `ReelScriptSchema` rejects both).
- **Drop-off reels name the free alternative; parking reels lead with the gate-vs-pre-book saving.**
- **Never touch `partners.json` / affiliate ranking.**
- **Review only — nothing auto-publishes.** Do not post, DM, or call any publishing API.

## Steps
1. `REELS_DATE=$(date +%F) pnpm --filter @mathfamily/reels generate` → writes validated ReelScripts.
2. For each script: `REELS_TTS=vibevoice python tools/reels/tts/synth.py <script.json>` → `voice.wav` + `timing.json`.
3. For each script: `pnpm --filter @mathfamily/reels render -- <script.json>` (from the proven render path — see `tools/reels/README.md`; use internal disk / CI if local bundling hangs).
4. (Optional) Generate an on-brand cover per reel via the Canva MCP (see `tools/reels/README.md`).
5. Report the review folder path, the reels produced (`format:slug`), and any slot skipped for lack of verified data. Nothing is published.

## Output
`tools/reels/review/<date>/` — one `<brand>-<slug>.json` + `voice.wav` + `timing.json` per reel, and `tools/reels/out/<date>/<brand>-<slug>.mp4`. All gitignored (transient, reviewed locally).

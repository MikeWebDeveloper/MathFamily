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
The whole batch (voice → captions → MP4 → PNG still) runs in one command:
`REELS_DATE=$(date +%F) tools/reels/build-week.sh` (British Kokoro voice via Apple MLX — see `tools/reels/tts/README.md`).

Under the hood:
1. `REELS_DATE=$(date +%F) pnpm --filter @mathfamily/reels generate` writes validated ReelScripts to `tools/reels/review/<date>/`, **appends each to the content ledger** (`tools/social/ledger.jsonl`) with a first-party **UTM landing URL**, and **skips airports covered in the last 14 days** (cross-run dedupe; tune with `REELS_DEDUPE_DAYS`).
2. Per reel (build-week.sh does this): `synth.py` (Kokoro) → `<slug>.wav` + timing; `transcribe.mjs` → captions; `render.mjs` → MP4 (h264/yuv420p/bt709, loudnorm −14 LUFS, opt-in music via `REELS_MUSIC`); `still.mjs` → PNG.
3. (Optional) On-brand cover per reel via the Canva MCP (see `tools/reels/README.md`).
4. Report the review folder, the reels produced (`format:slug`), the **UTM landing URL per reel** (the link to drop in the post / link-in-bio), and any slot skipped for lack of verified data. Nothing is published.

## Output
`tools/reels/out/<date>/` — `<brand>-<slug>.mp4` + `.png` per reel. Scripts/audio/captions live in `tools/reels/review/<date>/`. Every reel is recorded in `tools/social/ledger.jsonl` (id, hook, UTM campaign, landing URL, status) — the single source of truth for attribution + dedupe. All gitignored (transient/local).

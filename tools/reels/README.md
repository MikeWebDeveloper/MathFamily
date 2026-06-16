# tools/reels — branded reel factory

Verified dataset numbers → on-brand 1080×1920 MP4 reels (Remotion) with local
VibeVoice voice-over. Review artifacts only — **nothing auto-publishes**.

## Run
```bash
pnpm --filter @mathfamily/reels generate              # write ReelScripts to review/<date>/
pnpm --filter @mathfamily/reels test                  # unit tests (config-less vitest)
python tools/reels/tts/synth.py review/<date>/<slug>.json   # → voice.wav + timing.json
pnpm --filter @mathfamily/reels render -- <slug>      # → out/<date>/<slug>.mp4
```

## Render environment (IMPORTANT)
Remotion bundles with esbuild, which **deadlocks on `/Volumes/TB4 Workstation`**
(see `docs/engineering-notes.md`). Render from an internal-disk checkout or in CI.
`RENDER_DIR=/Users/<you>/reels-render pnpm ... render` overrides the bundle dir.

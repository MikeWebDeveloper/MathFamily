# ParkMath/RoamMath Branded Reel Factory — Design Spec

*A governed pipeline that turns verified dataset numbers into on-brand vertical videos
(1080×1920) with local AI voice-over, for TikTok / Instagram Reels / Facebook Reels. Reels render
from React via **Remotion** (so they're pixel-identical to the site brand), are voiced locally by
**VibeVoice** (Microsoft Research, MIT, run on Apple Silicon via MLX), and **never auto-publish** — a
human reviews the script and previews the MP4 before posting by hand. Lives at `tools/reels/`,
following the existing `tools/*` "generate → review → publish" pattern. ParkMath first; RoamMath via a
teal token swap.*

## Intent

ParkMath/RoamMath's moat is **verified, surprising, money-shaped numbers** ("£7 to drop someone off at
Stansted — for 15 minutes"). That is inherently short-form-video content. The site already *is* a
React + Tailwind + IBM Plex design system (`packages/ui`, `tokens.css`); Remotion renders video *from
React*, so the cheapest path to perfectly on-brand, repeatable reels is to render them from the same
tokens, fonts, and component idiom we already ship — scripted from the live datasets, voiced by a free
local model, and gated by the same "never auto-publish a price" discipline as everything else here.

This is the video analog of the existing `content-factory` skill: it produces **review artifacts**, not
posts.

## Decisions locked (owner-approved)

- **Backbone: Remotion** (render vertical MP4 from React, reusing brand tokens/fonts). Not Canva-authored
  video, not an ffmpeg slideshow. Canva is a *complement* (covers/carousels/thumbnails) only.
- **Voice: VibeVoice**, run **locally via Apple MLX** — default **Realtime-0.5B** for batch speed, step
  up to **1.5B** for hero reels; the 7B/Large is RAM-heavy and not the default. **Kokoro-82M** is the fast
  fallback; macOS `say` is a zero-dep draft/timing mode. The TTS step is **pluggable via env**, and the
  model port + revision are **pinned** for reproducible renders. No cloud TTS, no API key, no per-use cost.
- **Content: rotate three formats** — *shock-fee → the fix*, *money-saving how-to*, *this week in airport
  costs* — chosen per slot by the script generator.
- **Brand order: ParkMath first**, RoamMath later via the existing teal `@theme` token swap (identical code).
- **Cadence: weekly batch** (~3–5 reels), folded into the Sunday `content-factory` rhythm.
- **One vertical asset** (1080×1920) serves TikTok + IG Reels + FB Reels.
- **Governance:** verified numbers only (pulled from datasets, never invented); each reel shows its
  `sourceUrl` + `verifiedAt`; **no affiliate links** in social copy; human reviews script **and** previews
  MP4 before any post.
- **Captions burned in** by default (silent autoplay). Background music optional, quiet, royalty-free.
- **Render environment:** render from internal disk or CI to dodge the documented TB4 esbuild deadlock
  (see Risks).

## Architecture

New workspace tool at **`tools/reels/`** (a `tools/*` member, so `pnpm-workspace.yaml` already globs it).
Node/TS + Remotion for video, a small Python step for TTS, read-only on `packages/data`. No changes to
`apps/*` or the shared packages.

### 1. `ReelScript` schema + script generator

- **`tools/reels/src/schema.ts`** — a Zod `strictObject` (same discipline as `packages/data/src/schemas.ts`)
  defining a `ReelScript`:
  ```ts
  ReelScript = {
    version, brand: "parkmath" | "roammath", format: "shock-fee" | "how-to" | "news",
    slug,                       // airport/topic slug, kebab
    figures: { id, label, pence }[], // canonical verified numbers, integer pence, read from the dataset
    scenes: Scene[],           // each: kind, onScreenText, figureIds (reference figures[].id), durationHintMs
    narration: string,         // the VO text (what VibeVoice speaks)
    captions: CaptionCue[],    // text the burned-in captions show (derived from narration)
    cta: string,               // e.g. "Full list at parkmath.co.uk"
    sourceUrl, verifiedAt,     // provenance, copied from the dataset record
  }
  ```
  Schema refinements enforce governance: `narration`/captions/cta contain **no `awin1.com`/affiliate URL**,
  the `parkmath.co.uk` (or `roammath.co.uk`) mention is present, and every `figures[].pence` is a
  non-negative integer.
- **`reel-factory` skill** (`.claude/skills/reel-factory/SKILL.md`) + **`tools/reels/src/script/`** — selects
  the week's slots, pulls records from `loadDropOffDataset()` / parking / lounges / news via
  `@mathfamily/data`, rotates the three formats, and writes one validated `ReelScript` JSON per reel into the
  review folder. Figures are *read from data*, never authored. Mirrors `content-factory`'s "write a
  reviewable file, human approves" contract.

### 2. Voice-over renderer — `tools/reels/tts/`

- **`tools/reels/tts/synth.py`** — reads a `ReelScript`'s `narration`, runs **VibeVoice via MLX** (pinned
  community port + model revision), writes `voice.wav` + **`timing.json`** (sentence/word offsets) so scenes
  can sync to the audio. Engine selectable by env (`REELS_TTS=vibevoice|kokoro|say`); `say` produces fast
  robotic drafts for timing only.
- **`tools/reels/tts/README.md`** — install + pinned-revision notes; this is the one step that needs a Python
  env. Kept out of the Node/turbo graph (like `tools/awin`/`tools/watchdog` are plain helpers).

### 3. Remotion scenes — `tools/reels/src/scenes/`

- A Remotion project (`tools/reels/remotion.config.ts`, `src/Root.tsx`, `src/scenes/*`) rendering vertical
  scenes from a `ReelScript` + its audio: **brand intro** → **big IBM Plex Mono fee number** (count-up; the
  signature "measured data" move from `DESIGN.md`) → **free-alternative / saving callout** → **green
  "Verified [date]" stamp + source** → **`parkmath.co.uk` end card**.
- Brand fidelity: imports the real tokens (navy `#0A2540` / accent `#2563EB`; RoamMath teal `#134E4A`) and
  IBM Plex Sans + Mono via `@remotion/tailwind-v4` + `staticFile` fonts. Reel-specific scene components live
  here (not in `packages/ui`) to keep Remotion decoupled from Next/app concerns; shared *values* (the token
  hexes, type scale) are the reuse surface.
- The narration audio (via `<Audio>` + `timing.json`) drives total duration; **burned-in captions** render
  from `captions`.

### 4. Render + mux — `tools/reels/render.mjs`

- Wraps `remotion render` → 1080×1920 **H.264 MP4** with the audio track muxed, one per `ReelScript`, into
  **`tools/reels/out/<date>/<brand>-<slug>.mp4`** (gitignored). A `RENDER_DIR` env override lets the bundle +
  render run from internal disk (TB4 esbuild caveat).

### 5. Canva complement (MCP) — covers, carousels, brand kit

- One-time: **create the Canva brand kit** (currently empty: `list-brand-kits` → `[]`) — navy/teal, IBM Plex,
  logo — so all static social is on-brand.
- Per reel: optional **cover frame** + **static carousel** via Canva MCP `generate-design`
  (`your_story` 1080×1920 / `instagram_post`) using the brand kit, exported to the review folder. Canva never
  touches the video itself (the MCP can't author motion or audio — see Scope).

### 6. Review + publish

- All outputs land in a dated review folder (mirrors `tools/social`): the `ReelScript` JSON, the MP4, the
  cover/carousel. The artifacts are **gitignored** (transient, reviewed locally). A human watches the MP4,
  approves, and posts via **Buffer/Postiz** by hand.

### Data flow

`datasets (verified)` → script generator → **`ReelScript` JSON (review)** → [ TTS → `voice.wav` + `timing.json` ]
+ [ Remotion scenes ] → render+mux → **MP4** (+ Canva cover) → **human review** → manual post to TikTok/IG/FB.

## CAN / CAN'T (governance baked into the schema + generator)

| ✅ CAN | ❌ CAN'T |
|---|---|
| Show figures **read from the datasets**, as integer pence, with the `verifiedAt` stamp on screen | Invent, round, or estimate a number not present in a dataset record |
| Put the `sourceUrl` + "Verified [date]" in every reel and the `ReelScript` | Ship a reel whose figures have no provenance |
| Mention `parkmath.co.uk` / `roammath.co.uk` as the destination | Put an **affiliate / `awin1.com` link** in narration, captions, or caption text |
| Generate the script + assets automatically | **Auto-publish** — a human must review script **and** MP4 first |
| Pin the TTS model port + revision; render deterministically from data | Let a non-reproducible/cloud step silently change the brand voice |

## Testing

Config-less vitest (no config files — TB4 esbuild deadlock, per `docs/engineering-notes.md`); tests in
`tools/reels/tests/`.

- **`tools/reels/tests/schema.test.ts`** — `ReelScript` schema accepts a valid fixture; **rejects** a script
  with an `awin1.com` URL in narration/captions, a missing `parkmath.co.uk` mention, a non-integer `pence`,
  or a missing `sourceUrl`/`verifiedAt`.
- **`tools/reels/tests/script-generator.test.ts`** — over fixture datasets: emitted figures **match the
  dataset records** (no invented numbers), the format rotation is correct, and governance holds (no affiliate
  link, brand URL present).
- **`tools/reels/tests/scene.test.tsx`** — `renderToStaticMarkup` of a scene from a fixture `ReelScript`
  contains the formatted fee (`formatPence`), the airport name, and the "Verified [date]" + source (like the
  app `*-answer` tests; no jsdom).
- **Integration (excluded from CI fast path, Playwright-style):** a one-reel TTS smoke render and a one-reel
  Remotion render, run locally or in CI, not in `turbo run test`.

## Scope

**In scope:** `tools/reels/` workspace tool — the `ReelScript` schema; the `reel-factory` script generator
+ skill; the Python MLX VibeVoice/Kokoro TTS step; the Remotion scenes + render/mux; the Canva cover/carousel
complement + brand-kit setup; the review-folder contract; the tests above.

**Out of scope (now):**
- Auto-posting / scheduler integration (stays manual via Buffer/Postiz, per existing social rules).
- RoamMath reels (designed-for via the token swap, but ParkMath ships first).
- Multi-speaker "Q&A" reels (VibeVoice supports it — a fast-follow format, not v1).
- Background music library (optional; v1 can ship caption-only / silent-bed).
- Cloud/Lambda render farm (local + CI render is enough at weekly-batch volume).

**Future direction (designed-for):** RoamMath teal reels from the same code; VibeVoice multi-speaker two-voice
reels; a per-format scene-template library; optional Remotion Lambda if volume grows.

## Risks / de-risk order

1. **TB4 esbuild deadlock** — Remotion bundles via webpack/esbuild, which hangs on `/Volumes/TB4 Workstation`
   (see `docs/engineering-notes.md`). **Milestone zero:** prove a render works from internal disk (`RENDER_DIR`)
   and/or in CI (Ubuntu builds fine) before building scenes.
2. **VibeVoice on Apple Silicon** — smoke-test the pinned MLX port + a 10-second sample early; fall back to
   Kokoro if the port is unstable.
3. **Golden reel first** — build one airport, shock-fee format, end-to-end (data → script → VO → render → MP4)
   before scaling to the weekly batch and the other two formats.

## Success criteria

- `tools/reels/` produces, from a verified dataset record, a 1080×1920 MP4 with VibeVoice narration, burned-in
  captions, on-brand IBM Plex Mono figures, a "Verified [date]" + source, and a `parkmath.co.uk` end card — no
  invented numbers, no affiliate link.
- The `ReelScript` schema + generator tests are green under config-less vitest; the render/TTS smoke steps pass
  locally or in CI (not in the fast path).
- A weekly batch lands in a dated review folder (script + MP4 + cover) for human approval; nothing posts
  automatically.
- RoamMath and all `apps/*` / shared packages are untouched.

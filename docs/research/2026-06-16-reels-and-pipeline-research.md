# ParkMath — Reels & Autonomous-Pipeline Research Synthesis (2026-06-16)

Synthesis of 8 parallel research streams: 4 on **free production-quality** upgrades for the reel factory, 4 on **marketing strategy + what the autonomous pipeline really needs**. Everything here is free/low-cost and keeps our governance (verified-only, no affiliate links in social, human review). Source links are inline.

---

## Top priority stack (do these first — ranked by leverage ÷ effort)

1. **Fix render/export specs** (1 hr, high) — `--pixel-format=yuv420p`, `--color-space=bt709`, CRF 18, H.264, 30fps, AAC 192k, then an ffmpeg `loudnorm` pass to **−14 LUFS** (−12 for a TikTok cut). Without `yuv420p` the platforms re-encode and soften our crisp type.
2. **Word-level karaoke captions** (½ day, high) — `@remotion/install-whisper-cpp` (local whisper.cpp, free) → `@remotion/captions` `createTikTokStyleCaptions`. 85% watch muted; this is the single biggest retention lever, and we already have the wav + narration text.
3. **Safe zones** (1 hr, high) — keep all text/number/CTA inside a centred **~960×1350** box (clears TikTok's 164px right rail + IG's 320px bottom stack). Add `SAFE` constants; nudge the wordmark + captions in.
4. **Per-post tracking IDs + UTM** (½ day, very high) — give every reel/post a stable `id` and a `parkmath.co.uk/...?utm_source=<platform>&utm_medium=reel&utm_campaign=<airport>-<month>` link. This is the *join key* that unlocks all measurement — without it nothing downstream is attributable.
5. **Content ledger / state file** (½ day, very high) — append-only `tools/social/ledger.jsonl` (`{id,date,platform,format,airport,hook,status,postedUrl}`). Single source of truth → enables status tracking **and** cross-run/cross-skill dedupe (today content-factory + reel-factory both keep picking Heathrow/Glasgow).
6. **Free music bed + ducking** (½ day, high) — Pixabay Music / Mixkit (commercial-clean, no attribution) under the VO at ~15%, ducked via ffmpeg `sidechaincompress` post-render.
7. **Lean into the live drop-off-fee outrage NOW** (content, very high) — "national disgrace" press cycle is live (Heathrow £7, Gatwick £10/doubled-since-2021, Edinburgh £8.50, vs free EU airports). Ship the "UK drop-off fees ranked" + "European shame board" series this week.
8. **Tabler Icons (MIT)** (1 hr, medium) — swap ad-hoc glyphs for `@tabler/icons-react`; consistent, commercial-clean, free.
9. **Close the loop: weekly digest** (1–2 days, high; needs a Cloudflare API token) — read CF analytics + AWIN by-airport, join on the UTM/ledger IDs, emit "make more of what worked" into the next generation run. Converts the pipeline from open-loop to closed-loop.
10. **Upgrade analytics to Plausible** ($9/mo) — Cloudflare Web Analytics can't track outbound clicks or UTM conversions; Plausible can, cookielessly.

---

## Part 1 — Production quality (all free)

### 1.1 Captions (biggest retention win)
- Local, free pipeline: `npx remotion add @remotion/install-whisper-cpp` → `transcribe({ tokenLevelTimestamps:true, splitOnWord:true, model:"medium.en" })` on a 16kHz mono copy of our wav → `toCaptions()` → `@remotion/captions` `createTikTokStyleCaptions()`. Highlight the active word (amber on white), centre third, inside safe zone. Docs: [install-whisper-cpp](https://www.remotion.dev/docs/install-whisper-cpp/transcribe), [captions API](https://www.remotion.dev/docs/captions/api).
- Caption rules: ≤5–7 words/line, 2–4s on screen, dark outline/pill for legibility ([ContentFries](https://www.contentfries.com/blog/the-science-of-video-captions-how-they-impact-audience-retention)).

### 1.2 Render + audio specs
- Render: `--codec=h264 --crf=18 --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=192k` ([Remotion encoding](https://www.remotion.dev/docs/encoding)).
- Loudness: two-pass ffmpeg `loudnorm=I=-14:TP=-1.5:LRA=11` (use `-12` for a TikTok master) ([guide](https://32blog.com/en/ffmpeg/ffmpeg-audio-normalization-loudnorm)).
- Kokoro polish (no model swap): spell numbers as words, end sentences with `.`, use `...` for suspense pauses, drop `speed` to ~0.92 (0.85 for the number-drop), brighten with `equalizer=f=3000:t=o:w=1:g=2`.

### 1.3 Safe zones (1080×1920)
Conservative cross-platform content box ≈ **960×1350 centred**. TikTok right rail ≈ 164px (worst case); IG bottom stack ≈ 320px; top ≈ 130px. Wire `SAFE = {TOP:140, BOTTOM:340, LEFT:72, RIGHT:180}` and route captions/CTA/number through it. Sources: [Kreatli safe-zone hub](https://kreatli.com/guides/safe-zone-guide), [TikTok specs](https://trustypost.ai/blog/tiktok-video-size-2026-dimensions-ratio-safe-zones/).

### 1.4 Length, hook, loop
- Target **21–30s** (universal sweet spot; we're a touch short at ~15s — fine, can extend with a beat). Hook payoff in first 2s (we do). 2026 virality bar ≈ **70% completion** ([Retensis](https://retensis.com/blog/tiktok-retention-rate-benchmarks-2026)).
- Put the CTA in the **caption**, not the video (preserves the loop); design the last frame to loop to the first.

### 1.5 Music + SFX (free, commercial-clean)
- **Pixabay Music** (no attribution) primary; **Mixkit** for SFX (whoosh/data-ping). Duck under VO post-render: `ffmpeg ... sidechaincompress=threshold=0.015:ratio=8:attack=50:release=500 ... amix=weights=1 0.15`. ([Pixabay license](https://pixabay.com/service/faq/), [ffmpeg sidechain](https://gist.github.com/mhavo/533fa9586bdd090836116bac71c769f0)).

### 1.6 Voice upgrades (optional; Kokoro is a fine baseline)
- **Chatterbox** (Resemble, MIT) — expressive, `exaggeration`/`cfg` params, MPS port, voice-clone from ~10s; slower + a known memory leak on 16GB. Best expressiveness uplift.
- **F5-TTS** / **Qwen3-TTS (MLX, Apache-2.0)** — for one *consistent ownable "ParkMath voice"* (clone a clean 15s British reference, reuse every render). Qwen3 VoiceDesign can lock a persona without a clip.
- **Avoid XTTS-v2** (Coqui CPML licence is a commercial grey zone; Coqui defunct). Piper = draft-only quality.

### 1.7 Visual assets (free, commercial-clean) + Remotion packages
- **Tabler Icons** (MIT) + **Lucide** (ISC): icons, no attribution. **unDraw / DrawKit free / Blush free**: flat hero illustrations, commercial-OK, no attribution (recolour to navy before export). **Avoid Storyset** (forced attribution) and **OpenMoji** (CC-BY-SA ShareAlike).
- Local AI gen if ever needed: **Draw Things + Flux Schnell (Apache-2.0)** on Apple Silicon (~50s/image) — keep prompts "flat vector, minimal, navy, no gradients". Stay mostly code-drawn (on-brand + data-driven).
- Adopt: `@remotion/captions`, `@remotion/install-whisper-cpp`, `@remotion/transitions` (fade/slide only — no flashy wipes for a trust brand), `@remotion/shapes` (progress arc), `@remotion/noise` (subtle texture). Always `extrapolateLeft/Right:"clamp"` on `interpolate`.

---

## Part 2 — Marketing strategy & pipeline

### 2.1 Distribution & scheduling (free)
- **Postiz** (AGPL, self-host on a ~$5/mo VPS) is the best free scheduler: all 5 video platforms, no post limits, has an API/MCP. Fallback: **Buffer free** (3 channels) for TikTok+IG+YT, post Pinterest/FB natively. ([Postiz](https://github.com/gitroomhq/postiz-app)).
- Pipeline should emit a **`post-spec.json` per reel** (per-platform caption + hashtags + suggested schedule) so review→schedule is ~5 min. Always upload a **clean, no-watermark** master natively; **stagger** posts (TikTok→IG→YT→FB→Pinterest), never simultaneous; watermarked cross-posts lose 30–70% reach.
- Honest take: at 3–5 reels/week the bottleneck is review, not posting — **semi-automated** (pipeline → human 5-min review → Postiz auto-posts) beats full API automation (TikTok/Meta/YT audits take weeks for marginal gain).

### 2.2 Growth playbook (90-day)
- **Now:** ride the live drop-off-fee outrage. Series: **"UK drop-off fees: ranked"** (per airport), **"European shame board"** (Heathrow £7 vs Munich/CDG/Schiphol free), **"the Tuesday test"**, **"gate-vs-prebook leaderboard"** (monthly recurring), **lounge break-even**. Specific-number hooks ("Gatwick: £10 to drop off for 10 minutes") beat generic.
- **Repurposing flywheel** (1 verified fact → 7 assets over ~7 days): reel (TikTok+IG) → Threads thread (+chart image; images +60% on Threads) → X thread → IG carousel (saves) → Pinterest infographic (index *before* the season) → site data page → email.
- **Cadence** 3–5 reels/week; peak slot **Fri 18:00–22:00 GMT**, secondary Tue/Thu eves.
- **KPIs that matter:** 3-sec hold rate, **saves/1k reach**, **shares/1k reach**, site sessions from social, AI-citation appearances. Ignore raw followers/impressions/likes.

### 2.3 GEO / AI-search synergy
Build per-airport site pages that earn AI citations: **answer-first** (40–60 word direct answer per H2), one verified stat per 150–200 words, self-contained sections, **FAQPage + Article schema**, `datePublished`/`dateModified`, "verified on [date]", external links to official airport sources. Perplexity favours content <13 weeks old → our news/freshness freshness is an advantage. Ties directly to the existing `ai-citation-check` skill. ([Frase GEO](https://www.frase.io/blog/what-is-generative-engine-optimization-geo)).

### 2.4 Compliance (MUST-GET-RIGHT — UK ASA/CMA 2026)
- **@parkmathuk own-brand posts do NOT need `#ad`** *provided*: no affiliate/AWIN link in the post, no third-party brand (Holiday Extras/Purple Parking) named in the social copy, and claims are substantiated. The account-name-matches-brand "clear by context" exception covers us. ([ASA social](https://www.asa.org.uk/advice-online/recognising-ads-social-media.html)).
- The affiliate-disclosure duty sits at the **link level**, not the category level — our "social → own site → affiliate on-site" model is legitimate (how comparison sites operate). Keep the **"Ad" label** on the on-site Holiday Extras button.
- **Savings claims** ("up to 25% off"): ≥~10% of options must hit the max; "was" price must be a genuine ≥3-month reference. Only use HE's confirmed 10% (25% Gatwick-only) vs HE's *own* undiscounted price. ([Rule 3.39](https://www.asa.org.uk/advice-online/promotional-savings-claims.html)).
- Stakes: DMCC Act 2024 gives the CMA fines up to **10% of global turnover** — get disclosures right early.

### 2.5 Attribution (close the social → site → £ loop)
- Add **UTM** to every social link (`utm_source/medium/campaign/content`). Use a **self-hosted `/go` redirect** on parkmath.co.uk for link-in-bio (keeps UTMs, own domain) — not Linktree.
- **Plausible** ($9/mo) for outbound-link + UTM conversion tracking (Cloudflare Web Analytics can't do this).
- **Dynamic AWIN `clickref`**: on the landing page, read the visitor's UTM and append `clickref=ig-lhr-jun26` to the on-site AWIN button — ties social content → commission in AWIN reports, *without* any affiliate link in social. (We already attribute by airport+surface via `parseClickRef`.)

### 2.6 What the autonomous pipeline really needs (the big one)
Today it's a **fan of stateless generators** (content-factory, reel-factory, freshness, news-watch, watchdog, awin-digest) with a strong human-review gate but **no shared state and no feedback loop**. Gaps + fixes, in order:

- **(A) Tracking IDs + UTM** on every generated item — the enabling join key. *(quick)*
- **(B) Content ledger** `tools/social/ledger.jsonl` — single source of truth with status (generated→reviewed→posted→live) + the live URL. *(quick)*
- **(C) Cross-run/cross-skill dedupe** — generators read the ledger to stop repeating the same airports/angles week-over-week (today only deduped *within* one batch). *(quick — one PR with A+B+C)*
- **(D) Weekly digest closes the loop** — `tools/cloudflare/analytics.mjs` + join CF traffic ↔ AWIN ↔ ledger IDs → "make more of what worked" feeds the next run. *(needs a Cloudflare API token)*
- **(E) Rendered-reel QA gate** — `tools/reels/qa.mjs`: MP4 non-silent, duration sane, on-screen figure == `figures[].pence`. Protects the verified-numbers promise from a silent render regression.
- **(F) Fleet observability** — roll up `run-agent.sh` logs + scheduled-task states into one ops report; alert on "expected vs actual" (e.g. content-factory must emit 7).
- **(G) Hook A/B** — only once A/B/D exist: emit 2 hook variants, compare 48h retention.

2026 best practice is explicit: a **closed create→measure→learn→adjust loop** with a content calendar as single source of truth and a HITL approval gate is table-stakes — we have the gate and half the measurement, but none of the feed-back. ([eclincher](https://www.eclincher.com/articles/social-media-ai-agents-to-scale-your-content-strategy-in-2026), [Opal SSOT](https://workwithopal.com/about/blog/single-source-of-truth-in-marketing/)).

---

## Recommended next PRs
1. **Reel polish PR** — export/loudness flags + karaoke captions + safe-zone constants + music-bed ducking (Part 1.1–1.5).
2. **Pipeline-memory PR** — tracking IDs + UTM + `ledger.jsonl` + cross-run dedupe (Part 2.6 A–C). Highest leverage, no external blocker.
3. **Close-the-loop PR** — Cloudflare analytics reader + weekly digest recommendation feeding generation (needs CF token) + Plausible + `/go` redirect + dynamic clickref (Part 2.5, 2.6 D).
4. **Content push** (no code) — drop-off-fee outrage series + repurposing flywheel this week (Part 2.2).

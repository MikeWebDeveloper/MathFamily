---
name: marketing-advisor
description: Use when deciding what online marketing to do for ParkMath (or RoamMath) — planning a morning/week of posts, picking which channel or routine to run, choosing directory/backlink targets, scoping forum outreach, or answering "what should I do to grow the site".
---

# Marketing advisor (ParkMath / Math family)

Advice-and-routing layer for ParkMath growth. It tells you **what to do and which existing routine to run** — it does not post, submit, or publish anything itself. The doing happens in the dedicated skills below (or by Mike's hand).

## The one principle everything hangs off
ParkMath wins on **verified, date-stamped numbers presented by an independent source.** Every piece of marketing leads with a real figure from the live datasets and names the free/cheaper alternative. That trust model is the moat — never trade it for a louder claim.

## Non-negotiable guardrails (apply to ALL earned media)
- **No affiliate links in any social / forum / blog / email copy. Ever.** Only `parkmath.co.uk` (or a bare `parkmath.co.uk/<path>`) — no `?ref=`, UTM, or tracking params in shared links either. Affiliate links live on the site only, with disclosure.
- **Numbers must be real, current, date-stamped.** No rounding-for-effect, no fabricated history (honest-trend rule). If a figure isn't in the data, don't use it — pick an airport that has it.
- **Drop-off content always names the free alternative; parking content leads with the gate-vs-pre-book saving.**
- **On forums: cite ParkMath as an *independent* source, never claim authorship in a first reply.** On your own blog/IndieHackers/Medium, authoring it is fine.
- **Nothing auto-publishes.** Routines write review files / open PRs; a human approves.

## Channel + routine map
| Goal | Run / do | Cadence |
|------|----------|---------|
| Week of social posts + email digest | `content-factory` | weekly (Sun) |
| Vertical video reels | `reel-factory` | weekly |
| Data-backed forum replies (from pasted leads) | `forum-scout` | as leads appear |
| Brand graphics (Pinterest/IG fee cards) | SVG render — see "Images" below | per post |
| Re-verify dataset numbers before a push | `freshness` | before big claims |
| Newsjackable airport changes | `news-watch` | weekly |
| Affiliate performance (clicks/earnings) | `awin-digest` | weekly |
| Site + deeplink health | `watchdog` | daily |
| Reel performance → what to make next | `loop-digest` | weekly |
| Are AI engines citing us? | `ai-citation-check` | monthly |

## "What should I do this morning?" decision guide
1. **Pick ONE hero number** that's fresh (not posted in the last few days — check `docs/marketing/` dated files) and ideally newsy. Adapt it across X / Threads / Bluesky in the house voice (lead with the figure, name the free alternative, bare `parkmath.co.uk`).
2. **One visual** — render the Pinterest pin and/or IG square from that number (see Images).
3. **One distribution act** — either a quality directory/backlink registration, OR a genuinely-helpful forum reply (cap 2–3/day, mention the link in ~1 of 3–4).
4. If numbers feel stale, run `freshness` first.
5. Keep a light touch: no two posts/replies that read as a campaign in the same venue back-to-back.

**Tiebreaker for a short, solo slot:** do 1+2 (hero-number post + matching SVG visual) — that's the repeatable daily trust-building unit and fits ~30 min. Defer step 3 when it needs Mike's login/captcha (most directories do); forum replies are the better solo option if you have leads.

## Images (brand-locked, numbers exact)
Generate graphics as **SVG in one shot** (`mcp__visualize__show_widget`) or via the code-render pipeline — **never Canva or AI-diffusion** (diffusion hallucinates the digits). Tokens: navy `#0A2540`, off-white `#F6F5F1`, green verified pill `#16A34A`, blue `parkmath.co.uk` chip `#2563EB`, IBM Plex Mono figures, flat (no gradients/shadows/photos). Pinterest 1000×1500 (2:3), Instagram 1080×1080 (1:1), hardcoded hex so it doesn't invert in dark mode. End fee lists on the FREE airport.

## AI video (Google Flow / Gemini Omni) for reels
Flow's default model is **Gemini Omni Flash** (not Veo; Veo 3.1 is the cinematic alternative).
- Generate **native 9:16, 10s** in one go; structure with timestamp beats `[00:00-00:02] ...`, leading each with the camera move (shot + subject + action + context + ambiance + `SFX:`/`Ambient noise:`).
- **No text/numbers in-model — ever.** Render every price, CTA, and the `parkmath.co.uk` end-card as a post overlay (Remotion). Prefer no spoken dialogue; add the VO in post.
- **Negative prompt = comma list of nouns** (never "no/don't"): captions, subtitles, on-screen text, license plate digits, logos, face morphing, distortion, shaky camera.
- Consistency: lock a **seed** + add an **Ingredient** reference image (gen with Nano Banana Pro) so the character/product holds across beats.
- Creative bar: **hook in the first 2s** (open in media res), lean on **physical/visual comedy** (works without text), keep **one character** for consistency, use a **contrast gag** (chaos → calm) to land the message. SynthID watermark on all output. See [[parkmath-reel-flow-omni-prompting]].

## Backlinks & directories — quality only
- **Submit reputable, relevant, free listings only.** Never link-farm / PBN / "300+ directory" listicles — they're net-negative.
- Best targets (most need Mike's login/captcha): Product Hunt, AlternativeTo, SaaSHub, IndieHackers ("Show IH" story). Position ParkMath as the *independent alternative* to Holiday Extras / APH / Purple Parking.
- Be honest about follow/nofollow: PH/AlternativeTo links are largely nofollow but high-authority + drive roundup links and traffic; for pure dofollow UK link equity, a UK business directory (e.g. FreeIndex) is the cleaner pick.
- Ready copy (tagline, 50-word, ≤60-char, alternative-to, categories) lives in `docs/marketing/directory-copy.md`. Submit email `hello@parkmath.co.uk`, maker "Michal Latal". Logo: no committed PNG yet — export one from the brand mark (`apps/parkmath/app/icon.svg` / `packages/ui/src/brand-logo.tsx`) when a directory needs an upload. Before resubmitting, check it isn't already pending (the live tracker can drift).

## Forums & communities
Targets: MoneySavingExpert "Flights & Holidays", r/uktravel, r/AskUK, airport/city subs, HotUKDeals, TripAdvisor, airport Facebook groups. Only engage on airports we actually cover. Set up F5Bot keyword alerts, paste leads into `tools/social/forum-leads.md` (create it from `forum-leads.example.md`), run `forum-scout`, edit drafts into Mike's voice, post by hand. Templates in `docs/marketing/forum-templates.md`.

## Where things live
- Strategy spec: `docs/superpowers/specs/2026-06-10-parkmath-roammath-design.md`
- Dated playbooks / drafts / queues: `docs/marketing/`
- Voice + accounts: `tools/social/accounts.md`, `tools/social/README*`
- Live data (the source of every number): `packages/data/datasets/parkmath/`

## Common mistakes
- Posting a number not in the data, or a "from £X" without the "from". → Verify against the dataset first.
- Re-using yesterday's airport/angle. → Scan `docs/marketing/` dated files before choosing.
- Dropping a Canva/AI-image with mangled digits. → SVG-render instead.
- Slipping an affiliate or `?ref=` link into earned copy. → Bare `parkmath.co.uk` only.
- Spraying low-quality directories for "backlinks". → Quality + relevance only.

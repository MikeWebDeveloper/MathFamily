---
name: ai-citation-check
description: Track whether AI answer engines (ChatGPT, Perplexity, Gemini) cite ParkMath / parkmath.co.uk for UK airport drop-off & parking questions, and write a monthly report. INTERACTIVE only — drives the logged-in Chrome via the Claude Chrome extension; cannot run headless. Use when asked to run the monthly AI-citation check.
---

# AI-citation-check routine

Monthly visibility check: ask a **fixed question set** to **ChatGPT, Perplexity, and Gemini**
through Mike's logged-in browser, and record — per engine × question — whether
**ParkMath / parkmath.co.uk** is cited and the **figure each engine quotes**. Output is one
committed report at `docs/reports/ai-citations-<YYYY-MM>.md` that **Mike reads** — nothing
auto-publishes, nothing is sent.

## ⚠️ INTERACTIVE ONLY — cannot run headless
- This skill **needs the Claude Chrome extension driving Mike's real, logged-in browser**
  (ChatGPT / Perplexity / Gemini sessions are behind his logins, and the engines gate bots /
  throw CAPTCHAs). It therefore **CANNOT** run under `claude -p … --dangerously-skip-permissions`
  / launchd like `/freshness` and `/news-watch` do.
- It is **NOT** wired into `tools/freshness/run-agent.sh` and **must not** be. Run it **on
  request, interactively, roughly monthly**. Per the marketing-ops spec (§C5) this is the most
  "assisted" workflow and the **lowest priority** of the agent workflows.
- If the Chrome extension is not connected, or any engine is not logged in, **stop and ask Mike
  to connect / log in** — do not fall back to scraping, to a headless fetch, or to answering
  from memory.

## Hard rules (read-mostly, observe-only)
- **Read-only / observe-only.** This skill **only reads** what the engines display and **writes
  one report file**. It does **NOT** modify datasets, affiliate ranking, `partners.json`, code,
  or any app content, and it never edits the engines' settings/memory. The single committed
  artifact is the report under `docs/reports/`.
- **Record, never influence.** Do not try to coach an engine toward citing ParkMath, do not
  paste links, and do not log in / sign up / change any account. Just ask the fixed questions
  and transcribe what comes back.
- **Verbatim figures only.** Record the figure **exactly as the engine stated it** (e.g.
  `£5 for 10 min`, `£40 / 7 days`). If an engine gives a range or no number, record the range or
  `—` — **never invent or "tidy" a figure**, and never substitute a number from our own datasets.
- **Citation = an explicit reference to ParkMath or `parkmath.co.uk`** in the answer body or its
  source/citation list (Perplexity's sources, ChatGPT's inline links, Gemini's "Sources"). A
  generic answer that merely happens to match our data is **not** a citation → `Cited = No`.
- **No affiliate links, no marketing copy.** This skill produces a measurement report only; it
  never drafts social/forum copy and never includes affiliate links. (Affiliate ranking lives in
  `partners.json` and is **out of bounds** for this skill entirely.)
- **Nothing auto-publishes.** The report is a committed file a human reviews. Do not open a PR
  that merges itself, do not post results anywhere, do not notify anyone.

## The fixed question set (do not paraphrase)
Ask these **three questions, verbatim**, to **each** of the three engines (9 cells total):

1. `How much does it cost to drop someone off at Heathrow?`
2. `What's the cheapest 7-day parking at Manchester Airport?`
3. `How much is the Gatwick drop-off charge?`

Keep the set stable month-to-month so the report is comparable over time. If Mike asks to add a
question, add it to **both** this list and the table columns — don't silently drift.

## Steps

1. **Preflight.** Confirm the Claude Chrome extension is connected to Mike's browser
   (`mcp__Claude_in_Chrome__list_connected_browsers`). Confirm — by opening each engine — that
   ChatGPT, Perplexity, and Gemini are **logged in / reachable** (no login wall, no CAPTCHA). If
   any is not ready, **pause and ask Mike** to connect/log in before continuing.
2. **Decide the report month.** Use the current month as `<YYYY-MM>` (today: 2026-06 → file
   `docs/reports/ai-citations-2026-06.md`). One report per calendar month; if the file already
   exists, ask Mike whether to overwrite or append a dated re-run section rather than clobbering.
3. **Run each engine × question (9 cells).** For each engine, open a **fresh chat** (so prior
   context doesn't leak), then ask each of the 3 fixed questions, one per fresh chat where the
   UI allows. For each answer, read the full response **and** its sources/citations panel, then
   capture:
   - `Cited` — `Yes` only if ParkMath / `parkmath.co.uk` appears in the answer or its
     sources/citations; otherwise `No`.
   - `Figure quoted` — the verbatim number(s) the engine gave (or `—` if none).
   - `Notes` — short: who it *did* cite (e.g. "cited Heathrow.com, MoneySavingExpert"), or
     "no number given", or "answer hedged". Optional but useful for trend-reading.
   Give each engine a few seconds to finish streaming and to load its sources before reading.
4. **Be resilient, but honest.** If an engine errors, rate-limits, or shows a CAPTCHA on a given
   question, record that cell as `Cited = n/a`, `Figure = —`, `Notes = "engine unavailable —
   <reason>"`. Do **not** retry aggressively, and do **not** fabricate a plausible answer.
5. **Write the report** to `docs/reports/ai-citations-<YYYY-MM>.md` (create `docs/reports/` if it
   doesn't exist) using the OUTPUT spec below.
6. **Report back to Mike** in chat: the file path, the headline citation count (e.g. "ParkMath
   cited in 2 / 9 cells"), and any month-over-month delta if a prior report exists. Do **not**
   commit, push, or open a PR unless Mike explicitly asks — leave the file staged for his review.

## OUTPUT spec — `docs/reports/ai-citations-<YYYY-MM>.md`

Exactly one Markdown file. Structure:

```markdown
# AI-citation check — <YYYY-MM>

- **Run date:** <YYYY-MM-DD> (interactive, Claude Chrome extension)
- **Engines:** ChatGPT, Perplexity, Gemini
- **Result:** ParkMath cited in <N> / 9 cells

## Citations by engine × question

| Question | Engine | Cited? | Figure quoted | Notes |
|---|---|:--:|---|---|
| Heathrow drop-off cost | ChatGPT | No | £5 for 10 min | cited heathrow.com |
| Heathrow drop-off cost | Perplexity | Yes | £6 / 15 min | parkmath.co.uk in sources |
| Heathrow drop-off cost | Gemini | No | — | no number given |
| Cheapest 7-day Manchester parking | ChatGPT | … | … | … |
| Cheapest 7-day Manchester parking | Perplexity | … | … | … |
| Cheapest 7-day Manchester parking | Gemini | … | … | … |
| Gatwick drop-off charge | ChatGPT | … | … | … |
| Gatwick drop-off charge | Perplexity | … | … | … |
| Gatwick drop-off charge | Gemini | … | … | … |

## Observations
- Where ParkMath is / isn't cited, and who the engines cite instead.
- Any figure an engine quoted that disagrees with our live data (flag for a /freshness check —
  but do NOT change any dataset here).
- Month-over-month change vs the previous `ai-citations-*.md`, if one exists.
```

Rules for the file:
- All **9 cells present**, in the question-then-engine order above (use `n/a` for any
  unreachable cell — never drop a row).
- Figures **verbatim**; `—` where none was given.
- Keep `## Observations` factual and short — it's a measurement log, not marketing copy.

## Output discipline
- **One report file per run**, at `docs/reports/ai-citations-<YYYY-MM>.md`. No other files
  touched.
- If the extension can't connect or the engines aren't logged in, produce **no** report — stop
  and ask Mike (an empty/guessed report is worse than none).
- Never commit/push/PR or send anything without an explicit ask; the human review gate stays.

---
name: forum-scout
description: Draft data-backed, genuinely-helpful forum replies for flagged ParkMath opportunities. Reads Mike's pasted F5Bot alerts / thread URLs from tools/social/forum-leads.md, drafts one reply per lead using live airport figures (gate vs pre-book, the free drop-off alternative, recent news.json change), cites parkmath.co.uk as an INDEPENDENT source — never an affiliate link, never claiming authorship in the first reply — and writes tools/social/forum-drafts-<date>.md for human review. Use when asked to run forum-scout / draft forum replies.
---

# Forum-scout routine

Drafts forum replies for opportunities Mike has flagged, grounded in the **live ParkMath
datasets**. It is **read-mostly**: it reads datasets only, **never** touches affiliate ranking
(`partners.json`/`airportOverrides`), and the drafts it writes contain **no affiliate links**.
Output is a committed review-file — **nothing auto-publishes**. Mike reads each draft, edits as
he likes, and posts it himself in his own voice.

This follows the same pattern as `freshness` / `news-watch` / `awin-digest`: a skill + a
`run-agent.sh` mode + a committed, human-reviewed artifact.

## Hard rules (read first — these override anything below)
- **No affiliate links, ever.** Drafts must not contain Awin links, `partners.json` deep links,
  or any monetised URL. The only ParkMath URL allowed is the plain editorial page
  (`https://parkmath.co.uk/...`), cited as an independent reference.
- **Cite as an INDEPENDENT source, not as the owner.** Mention parkmath.co.uk the way you'd
  mention any helpful comparison site — "there's an independent UK site, parkmath.co.uk, that
  tracks these". **Do NOT claim authorship in the first reply** (no "I run / I built / my site").
  No marketing voice, no CTA, no "check out".
- **Never modify affiliate ranking or any dataset.** This skill is read-only over
  `packages/data/datasets/parkmath/*`. It writes exactly one file under `tools/social/`.
- **Numbers must be real and current.** Every figure must come from the datasets below for the
  airport the lead names. **Never invent or round-guess a price.** If the datasets don't cover
  that airport (or the field is null), say so in the draft and omit the figure — don't fabricate.
- **Lead with help, not the link.** The reply answers the person's actual question first; the
  parkmath.co.uk reference is a supporting footnote, not the point.
- **Genuinely helpful + honest.** Drop-off replies always name the **free alternative**. Parking
  replies use the **gate-vs-pre-book saving** as the substance. State the `verifiedAt` date so the
  reader knows the figure is dated.
- **Draft only. Never post, never push, never PR.** Output is a file a human reviews.

## Input — `tools/social/forum-leads.md`

Mike pastes F5Bot alert lines and/or raw forum-thread URLs here, **one lead per line**, each
tagged with the airport it concerns. Format (a leading `airport:<slug>` token, then the
URL/quote; `#` lines and blanks are ignored):

```
# forum-leads.md — paste F5Bot alerts / thread URLs, one per line.
# Format:  airport:<slug> | <thread URL or F5Bot quote> | (optional note)
# Slugs are the dataset airportSlug values, e.g. heathrow, gatwick, manchester, stansted, luton.

airport:heathrow | https://www.moneysavingexpert.com/forum/discussion/12345/heathrow-drop-off-rip-off | OP angry about the £7 charge
airport:manchester | "anyone know cheapest way to park at MAN for a week in August?" | F5Bot: keyword "Manchester parking"
airport:stansted | https://www.reddit.com/r/unitedkingdom/comments/abc123/stansted_drop_off_fee/
```

Each lead = one draft. The `airport:<slug>` token selects which figures to pull. If a line has no
recognisable slug, note it as "unmapped" in the output and skip the figures (don't guess).

## Steps

1. **Read the leads.** Read `tools/social/forum-leads.md`.
   - If the file is **missing or has no non-comment, non-blank lines**, **no-op**: write nothing,
     and report `forum-scout: no leads (forum-leads.md missing/empty) — nothing drafted`.
2. **Load live data once** (read-only). Use the `@mathfamily/data` loaders:
   - `loadDropOffDataset()` → `drop-off-fees.json` records: `feeSummary`, `freeAlternative`
     (`{name, minutesFree, details}`), `priorYearFeePence`, `isFree`, `penaltyPence`,
     `verifiedAt`, `sourceUrl`.
   - `loadParkingDataset()` → `parking-tariffs.json` records: `products[]` with
     `productType` (`gate` = drive-up/on-the-day, `prebook` = book-ahead) and `prices[]`
     (`{days, totalPence}` for 3 / 7 / 14 days), `verifiedAt`, `sourceUrl`.
   - `loadNewsDataset()` → `news.json` `items[]`: pick the most recent item matching the lead's
     `airportSlug` (use `change` if present, else `summary` + `sourceUrl` + `publishedAt`).
   - `loadAirports()` → display name + IATA for the slug (e.g. `heathrow` → "London Heathrow (LHR)").
   - All prices are in **pence** — divide by 100 and format as `£X.XX` for the draft.
3. **Per lead, assemble the facts** for its airport:
   - **Drop-off:** the `feeSummary` and, always, the **free alternative**
     (`freeAlternative.name` + `minutesFree` min free + the gist of `details`). If
     `priorYearFeePence` is set and differs, you may note the year-on-year rise. If `isFree`,
     say it's free for the first N minutes rather than implying a charge.
   - **Parking (the 7-day hook):** compute the **gate vs pre-book** saving for `days: 7` —
     `gate.totalPence − prebook.totalPence` → "£G drive-up vs £P pre-booked, ~£S saved". If the
     airport has only `gate` (no `prebook` in the dataset), give the gate 7-day figure and frame
     pre-booking as generally cheaper **without** inventing a pre-book number.
   - **Recent change:** if `news.json` has a relevant recent item, mention it in one clause with
     its `sourceUrl` (e.g. East Midlands going barrierless/ANPR, a 2026 fee change).
4. **Draft the reply** (per lead) — genuinely helpful, plain, human:
   - Answer the person's actual question first, using the real figures + `verifiedAt` date.
   - Always name the free drop-off alternative; for parking, make the gate-vs-pre-book saving the
     substance.
   - Reference **parkmath.co.uk** once, as an **independent** tracker — not as yours, no CTA, no
     affiliate link. Skip the reference entirely if it doesn't add value to that specific thread.
   - Keep it forum-appropriate: short, no hype, no signature, no emoji-spam. Match the venue
     (MSE = practical/frugal; Reddit = casual). 60–140 words is plenty.
5. **Write the review-file** (see OUTPUT). Create `tools/social/` if it doesn't exist.
6. **Report** (see Reporting). Do not commit, push, or open a PR.

## OUTPUT — `tools/social/forum-drafts-<YYYY-MM-DD>.md`

One Markdown file, dated with today's date (use `$FRESHNESS_RUN_ID`'s date or `date +%F`). One
`##` section per lead, in input order. Each section:

```markdown
## Lead N — <Airport display name> (<IATA>)
- **Source:** <thread URL or pasted F5Bot quote>
- **Airport slug:** <slug>  ·  **Figures verified:** <verifiedAt date(s)>
- **Data used:** drop-off £… (free alt: …) · 7-day parking gate £… vs pre-book £… (~£… saved) · news: <title or "none">

**Draft reply (for Mike to review + post himself):**

> <the reply text — plain prose, no affiliate link, parkmath.co.uk cited as independent,
> no authorship claim>

**Reviewer checklist:** no affiliate link ✓ · independent framing ✓ · no authorship claim ✓ · figures match dataset ✓
```

Top of file — a one-line header:

```markdown
# Forum reply drafts — <YYYY-MM-DD>
_Read-only data, human-review-required. Nothing here is published. No affiliate links. Post in your own voice._
```

If a lead is **unmapped** (no recognisable slug) or its airport isn't in the datasets, still emit a
section that states this and gives general, non-fabricated guidance — never made-up numbers.

## Interface
- On-demand: `tools/freshness/run-agent.sh forum-scout` → `claude -p "/forum-scout"`.
- Optional daily launchd that simply **no-ops on an empty `forum-leads.md`** (step 1).
- Never scheduled to post anything — the artifact is the deliverable.

## Reporting (final line)
- Drafted: `forum-scout: N draft(s) written → tools/social/forum-drafts-<date>.md (M unmapped)`.
- Empty/missing input: `forum-scout: no leads (forum-leads.md missing/empty) — nothing drafted`.

---
name: content-factory
description: Generate a week of ParkMath social posts + the MailerLite email digest from live datasets, as two committed review-files a human approves before publishing. Use when asked to run the content factory / generate the weekly social queue.
---

# Content-factory routine

Generates **a week of social posts** and **the weekly email-digest body** from the live ParkMath
datasets, and writes them to two **committed review-files** Mike reads and pastes manually. It is
**read-mostly**: it reads datasets only, **never** modifies code, affiliate ranking, or any dataset,
and **never** auto-publishes. Mike pastes approved posts into Postiz and the digest into MailerLite.

Invoked headless (`claude -p "/content-factory"`); launchd fires it **Sun 09:00**.

## Hard rules (non-negotiable — bake these into every post)
- **Lead with a verified number.** Every post opens with a real figure from the datasets (a fee in
  £, a gate-vs-pre-book saving, a free-minutes allowance). Never an unsourced or rounded-for-effect
  number. If a figure isn't in the data, don't use it.
- **`parkmath.co.uk` in EVERY post.** No exceptions, every platform, every format.
- **NO affiliate links in social/forum copy. Ever.** Social posts link only to `parkmath.co.uk`
  (or a bare `parkmath.co.uk/<path>`). Never a merchant URL, never an AWIN/Awin tracking link,
  never a `?ref=`/affiliate param. The site is presented as an **independent** data source.
- **Never touch affiliate ranking or `partners.json`.** This skill does not read or write merchant
  ordering, EPC, or activation state. Out of scope entirely.
- **Drop-off posts ALWAYS name the free alternative.** Any post about a drop-off/forecourt fee must
  name the free option for that airport (`freeAlternative.name` + `minutesFree`) in the post body —
  the "you don't have to pay this" angle is mandatory, not optional.
- **Parking posts use the gate-vs-pre-book saving as the hook.** The headline number for a parking
  post is the difference between the `gate` (drive-up) price and the cheapest `prebook` price for the
  same airport + duration. That saving is the hook; lead with it.
- **Verified-only, null-over-guess.** If a required figure is missing/null for an airport, pick a
  different airport that has it. Never fabricate to fill a slot.
- **No affiliate/marketing claims, no superlatives you can't source** ("cheapest in the UK" only if
  the data shows it). House voice: plain, factual, answer-first — same trust model as the site.
- **Review-file only. Nothing auto-publishes.** Output is two committed files for a human. Do not
  post, send, DM, or call any publishing/email API.

## Inputs (read-only)
- `packages/data/datasets/parkmath/news.json` — `{ items: [...] }`. Use the **last 7** by `publishedAt`
  (newest first). Fields: `airportSlug, category, title, summary, change|null, sourceUrl, sourceLabel,
  publishedAt`. (Loader: `recentNews(7)` from `@mathfamily/data` returns these sorted.)
- `packages/data/datasets/parkmath/drop-off-fees.json` — `{ records: [...] }`. Per airport:
  `airportSlug, isFree, feeSummary, penaltyPence, freeAlternative {name, minutesFree, details},
  priorYearFeePence, sourceUrl, verifiedAt`.
- `packages/data/datasets/parkmath/parking-tariffs.json` — `{ records: [...] }`. Per airport:
  `products: [{ productType: "gate"|"prebook", name, prices: [{days, totalPence}] }], sourceUrl,
  verifiedAt`.
- `packages/data/datasets/airports.json` — `{ name, slug, iata, region }`. Resolve `airportSlug` →
  display `name` + `iata` for copy and for the `sourceAirport` output field.

Use `node`/`tsx` to read these (top-level wrappers differ: news is `{items}`, fees/tariffs are
`{records}`). Convert pence → £ for human copy (`£{(pence/100).toFixed(2)}`).

## Steps

1. **Load the data.** Read the last 7 `news.json` items, all `drop-off-fees.json` records, all
   `parking-tariffs.json` records, and `airports.json`. Build the per-airport gate-vs-pre-book saving
   for each duration: `gateTotalPence − cheapestPrebookTotalPence` for matching `days` (3/7/14).
2. **Pick the angles.** Favour airports that appear in the **recent news** (a `change` or a fresh
   `publishedAt` is the timeliest hook), then airports with the largest verifiable numbers (biggest
   drop-off fee, biggest gate-vs-pre-book saving). Spread across airports — don't make all 7 posts
   about Heathrow. Every post maps to exactly one `sourceAirport` (its slug).
3. **Generate exactly 7 posts**, each obeying every Hard rule:
   - **2 × TikTok** — `format: "tiktok-script"`. **Screen-record format, opening on the bill-shock
     reveal.** Line 1 is the shock number on screen (e.g. "£7. Every. Single. Drop-off."); then a
     2–4 beat script (HOOK → the number → the free alternative *or* the pre-book saving → "full
     numbers + sources at parkmath.co.uk"). Drop-off TikToks must name the free alternative; parking
     TikToks lead with the gate-vs-pre-book saving. Write it as labelled beats/on-screen text, ready
     to film a screen-recording of the site.
   - **2 × X/Twitter** — `format: "post"`, **`text` ≤ 240 characters** (hard cap, count it including
     the URL). Number-first, one fact, `parkmath.co.uk`.
   - **1 × Threads** — `format: "post"`. Slightly longer/conversational, still number-led, includes
     `parkmath.co.uk`.
   - **1 × Pinterest** — `format: "pin"`. `text` = a pin title + description; visual, search-friendly
     (e.g. "Heathrow drop-off costs £7 — here's the free option"); includes `parkmath.co.uk`.
   - **1 × LinkedIn** — `format: "post"`. Professional framing (consumer-cost transparency / data
     angle), still opens with the verified number and includes `parkmath.co.uk`.
   Assign each post a `day` (Mon–Sun, spread across the week) and 3–6 relevant `hashtags`
   (no `#ad`, no affiliate/brand-partner tags — it's not sponsored).
4. **Build the email digest.** From the **last 5–7** `news.json` items, write a plain-text MailerLite
   weekly-digest body: a short intro line, then one short paragraph per item (`title` + answer-first
   `summary`, and the `change` before→after if present), each with its **official `sourceUrl`**
   labelled by `sourceLabel`. Plain text + links only — no HTML, no affiliate links, no merchant
   URLs. End with one line pointing to `parkmath.co.uk`.
5. **Write both files** (create `tools/social/` if missing) — see OUTPUT. Do not commit, push, or
   open a PR; just write the files for human review.
6. **Self-check before finishing** (fix or drop any post that fails):
   - exactly 7 posts; platform mix = 2 TikTok, 2 X, 1 Threads, 1 Pinterest, 1 LinkedIn;
   - every post contains `parkmath.co.uk` and opens with a verified number;
   - every X post `text` ≤ 240 chars;
   - every drop-off post names the free alternative; every parking post leads with the
     gate-vs-pre-book saving;
   - **no affiliate/merchant link or tracking param anywhere** in either file;
   - every `text` figure traces to a real dataset value.

## Content ledger (shared memory — cross-run dedupe + attribution)
- **Before picking angles, read `tools/social/ledger.jsonl`** (append-only JSONL; may not exist yet — see
  `ledger.example.jsonl` for the shape). Avoid airports covered in the **last ~14 days**, including by the
  **reel-factory** (which writes here too) — spread coverage, don't repeat what reels just covered.
- **After generating, append one line per post** to `tools/social/ledger.jsonl`:
  `{"id":"parkmath-<platform>-<airport>-<YYYYMMDD>","date":"<YYYY-MM-DD>","brand":"parkmath","format":"post","slug":"<airport>","hook":"<first line>","utmCampaign":"<airport>-<YYYYMM>","landingUrl":"https://parkmath.co.uk/<path>?utm_source=<platform>&utm_medium=social&utm_campaign=<airport>-<YYYYMM>","status":"generated"}`
- The `landingUrl` is the first-party link to use in the post / link-in-bio for attribution — **never** an
  affiliate link. The ledger is gitignored (local memory); do not commit it.

## OUTPUT (two committed review-files)

### `tools/social/queue-<YYYY-MM-DD>.json` (today's date)
A **JSON array of 7 objects**, each:
```json
{
  "day": "Mon",
  "platform": "TikTok",
  "format": "tiktok-script",
  "text": "...",
  "hashtags": ["#parking", "#travelhacks"],
  "sourceAirport": "heathrow"
}
```
- `platform` ∈ `TikTok | X | Threads | Pinterest | LinkedIn`.
- `format` ∈ `tiktok-script | post | pin`.
- `sourceAirport` = the airport **slug** the post's number came from.
- Valid JSON, UTF-8, no trailing commas.

### `tools/social/email-digest-<YYYY-MM-DD>.md`
Plain-text MailerLite weekly-digest body (last 5–7 news items): intro line, one short paragraph per
item with its official source link (`[<sourceLabel>](<sourceUrl>)`), closing `parkmath.co.uk` line.
No affiliate links.

## Report (final message)
Report: the two file paths written, the 7-post platform breakdown, the airports covered, and the
number of news items in the digest. Note any Hard-rule slot you couldn't fill from verified data
(and which airport you substituted). Nothing is published — Mike reviews and pastes manually.

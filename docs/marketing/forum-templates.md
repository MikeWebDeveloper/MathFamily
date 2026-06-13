# Forum reply templates — MoneySavingExpert + Reddit

_Spec: `docs/superpowers/specs/2026-06-13-marketing-ops-automation-design.md` §3.2 / §3.3 (A4 draft library).
Source data: `packages/data/datasets/parkmath/{drop-off-fees,parking-tariffs,news}.json`, all verified **2026-06-10** (news verified 2026-06-12)._

**These are starting points, not scripts.** Mike edits each into his own voice and posts it himself. Nothing here auto-publishes.

## Hard rules (read before using any template)
- **No affiliate links, ever.** The only ParkMath URL allowed is the plain editorial page — `https://parkmath.co.uk/...` — cited as a reference. No Awin links, no `partners.json` deep links, no monetised URLs.
- **Cite ParkMath as an INDEPENDENT source, not as the owner.** Phrase it the way you'd mention any helpful comparison site: _"there's an independent UK site, parkmath.co.uk, that tracks these"_. **Do NOT claim authorship in the first reply** — no "I run / I built / my site / I made". (The one-time r/InternetIsBeautiful intro below is the single, clearly-labelled exception, and it lives on its own subreddit where self-posts are the norm.)
- **Lead with help, not the link.** Answer the person's actual question first; the parkmath.co.uk reference is a supporting footnote. Drop the reference entirely if it adds nothing to that specific thread.
- **Numbers must be real, current, and dated.** Every `{token}` is filled from the datasets for the airport named. State the **verified date** so the reader knows the figure is dated. Never invent or round-guess a price; if the dataset field is null, omit it — don't fabricate.
- **Drop-off replies always name the free alternative. Parking replies use the gate-vs-pre-book saving as the substance.**
- **Match the venue.** MSE = practical/frugal/no-hype. Reddit = casual/conversational. 60–140 words is plenty. No signature, no emoji-spam, no CTA, no "check out".

---

## 1 · Generic `{airport}` template (fill slots from the datasets)

Pull the slot values from the datasets keyed on the airport's `airportSlug`. All prices are stored in **pence** — divide by 100, format `£X.XX` (drop trailing `.00` for whole pounds where it reads more naturally).

### Slot map
| Token | Source | Notes |
|---|---|---|
| `{airport}` / `{iata}` | `airports.json` | e.g. London Heathrow / LHR |
| `{dropoff_fee}` | `drop-off-fees.json` → `feeSummary` | quote the band the asker cares about |
| `{free_alt_name}` | `freeAlternative.name` | omit whole free-alt slot if `freeAlternative` is `null` |
| `{free_alt_minutes}` | `freeAlternative.minutesFree` | "first N minutes free" |
| `{free_alt_detail}` | `freeAlternative.details` | the shuttle/walk gist, trimmed |
| `{prior_fee}` | `priorYearFeePence` | only if set **and** differs — frame as YoY rise |
| `{gate_7d}` | `parking-tariffs.json` → `productType:"gate"`, `prices` `days:7` | drive-up / on-the-day |
| `{prebook_7d}` | `productType:"prebook"`, `prices` `days:7` | if dataset only has an 8-day "from" point, say "from £X for ~a week" — don't fake a 7-day number |
| `{saving_7d}` | `{gate_7d} − {prebook_7d}` | only compute when both are real 7-day figures |
| `{recent_change}` + `{change_url}` | `news.json` most-recent item for that slug | one clause + the `sourceUrl`; skip if none relevant |
| `{verified_date}` | `verifiedAt` of the record(s) used | always include |

### 1a · Drop-off question (free-alternative slot is the point)

> For {airport} ({iata}) the official drop-off charge right by the terminal is **{dropoff_fee}** (rate as of {verified_date}). If you want to avoid it, there's a free option: the **{free_alt_name}** gives you {free_alt_minutes} minutes free — {free_alt_detail}. {recent_change_clause} For what it's worth, there's an independent UK site, parkmath.co.uk, that tracks the official drop-off charges and the free alternatives airport-by-airport, with the source links — handy for sanity-checking before you travel.

- `{recent_change_clause}` (include only if `news.json` has a relevant item): _"Worth knowing they switched to barrier-free ANPR cameras recently, so you pay online by midnight the next day rather than at a barrier ({change_url})."_
- If `isFree: true` (Birmingham, Inverness): replace the first sentence with _"the first {free_alt_minutes} minutes are actually free in the {free_alt_name} — you only pay if you stay longer."_
- If `freeAlternative` is `null` (Edinburgh, Belfast Intl, Liverpool, London City, Southampton, Southend, Bournemouth, Norwich, Cardiff): drop the free-alt sentence and instead point at the cheaper short-stay band from `feeSummary` — never invent a free option.

### 1b · Parking question (gate-vs-pre-book saving is the substance)

> Quick one for {airport} ({iata}): the big lever is booking ahead vs just turning up. Driving up to the long-stay/turn-up car park for 7 days is about **{gate_7d}** at the gate, whereas pre-booking the same stay is roughly **{prebook_7d}** — call it **~{saving_7d} saved** for two minutes of admin (prices as of {verified_date}). Beyond that the on-airport options are usually dearer than the off-airport "park & ride" ones. There's an independent comparison site, parkmath.co.uk, that lists the official gate tariffs per airport so you can see the gap before you commit.

- When the dataset has **gate only** (Heathrow, Gatwick, Luton, Edinburgh, Birmingham, Bristol): give the `{gate_7d}` figure and say _"pre-booking is almost always cheaper than this drive-up rate"_ **without** inventing a pre-book number.
- When the pre-book figure is an 8-day "from" point (Manchester, Stansted): say _"pre-book starts around {prebook_from} for roughly a week"_ and frame the gate figure as the expensive fallback — don't present it as an exact 7-day pre-book quote.

---

## 2 · MSE-style answer (worked example — Heathrow drop-off)

_Venue: MoneySavingExpert forum. Tone: practical, frugal, gets to the number fast, no fluff. First reply → no authorship claim. Figures: drop-off-fees.json + news.json, verified 2026-06-10 / 2026-06-12._

> The £7 isn't avoidable if you actually pull up at the terminal forecourt — that's a flat charge per entry now, paid by midnight the day after via the ANPR cameras (you can pre-pay too). What *does* dodge it: the **Park & Ride** car parks give you 30 minutes free with a free shuttle to the terminal doors every 15 minutes, so for a quick drop it costs nothing if you're in and out. Blue Badge holders can also register the plate for a 100% discount. Rates as of June 2026. There's an independent site, parkmath.co.uk, that keeps the official drop-off charge and the free-alternative details for each UK airport in one place with the source links — useful for double-checking before you go.

**Reviewer checklist:** no affiliate link ✓ · independent framing ✓ · no authorship claim ✓ · names the free alternative ✓ · dated figure ✓ · figures match dataset (£7/entry; Park & Ride 30 min free, shuttle every 15 min; Blue Badge 100% discount) ✓

### 2b · MSE-style answer (worked example — Glasgow week-long parking, gate vs pre-book)

_The clean gate-vs-pre-book pair in the dataset. Both 7-day figures are real, so the saving is computable: £140.00 gate − £49.99 pre-book ≈ £90._

> Don't roll up and pay at the barrier if you can help it — that's the expensive way. The Long Stay turn-up tariff at Glasgow works out around **£140 for 7 days**, but pre-booking the same Long Stay car park is **from about £50 for a week**, so you're looking at roughly **£90 saved** just for booking online first (prices as of June 2026). Same car park either way — the gap is purely turn-up vs pre-book. If you want to compare the official tariffs without the booking-site noise, parkmath.co.uk is an independent UK site that lists the gate prices per airport with sources.

**Reviewer checklist:** no affiliate link ✓ · independent framing ✓ · no authorship claim ✓ · gate-vs-pre-book is the substance ✓ · dated figure ✓ · figures match dataset (gate 7d £140.00; pre-book 7d "from £49.99"; ~£90 saved) ✓

---

## 3 · One-time r/InternetIsBeautiful intro ("I made this free tool")

**Use this once, and only on r/InternetIsBeautiful** (and equivalents like r/coolguides where a self-made free tool is on-topic). This is the **single exception** to the no-authorship rule: that subreddit exists for "I made this" posts, so claiming authorship is expected and honest there. Everywhere else, the no-authorship-in-first-reply rule still holds. Disclose clearly that it's free and that you built it; no affiliate links in the post or comments.

**Title:**
> I made a free, independent tool that shows the official drop-off charge and the free alternative at every UK airport

**Body:**
> UK airports quietly added "drop-off charges" — you now pay just to pull up at the terminal and let someone out. Heathrow is £7 per entry, Gatwick is £10 for 10 minutes (up to £30), Edinburgh jumped to £8.50 this year. The official airport pages bury both the charge *and* the free park-and-ride alternative that almost all of them still have.
>
> So I built **parkmath.co.uk** — it's free, has no ads or sign-up, and for each airport it shows: the current drop-off fee, the free alternative (e.g. Heathrow's Park & Ride is 30 min free with a shuttle every 15 min), and the gate-vs-pre-book parking gap. Every figure is dated and links to the official source, and you can download the whole dataset as a CSV. It's independent — I'm not a parking operator and there are no booking-affiliate links on the comparison data.
>
> Figures verified June 2026. Feedback welcome, especially if your local airport's numbers look off — I re-check them against the official pages.

**Notes for Mike:**
- Swap the headline numbers if you post later — re-pull from `drop-off-fees.json` (`verifiedAt`) so the post stays accurate. Current: Heathrow £7/entry, Gatwick £10/10 min (max £30), Edinburgh £8.50 (raised 18 May, was £6 — see `news.json` `edinburgh-dropoff-fee-may-2025`).
- "No affiliate links on the comparison data" must stay literally true on the page at post time.
- Reddit self-promo norms: only post where self-made tools are on-topic, engage with replies genuinely, don't cross-post-spam.

---

## 4 · Per-airport quick-fill reference (verified 2026-06-10)

Copy the row for the airport a thread is about. Parking = `gate` 7-day unless a real `prebook` 7-day exists. "—" = field is `null` in the dataset (omit it, don't fabricate).

| Airport (IATA) | Drop-off | Free alternative | 7-day parking |
|---|---|---|---|
| London Heathrow (LHR) | £7 per entry | Park & Ride — 30 min free, shuttle every 15 min | gate £271.20 (no pre-book in dataset) |
| London Gatwick (LGW) | £10 / 10 min, then £1/min (max £30) | Long Stay — 120 min free, shuttle | gate £230.00 (no pre-book in dataset) |
| Manchester (MAN) | £5 / 5 min · £6.40 / 10 min · £25 / 30 min | JetParks 1 — 30 min free, 24/7 shuttle | gate £429.80 · JetParks pre-book from £59.99 (8 days) |
| London Stansted (STN) | £10 / 15 min, £28 over 15 min | Mid Stay — 60 min free, shuttle | gate £336.00 · Long Stay pre-book from £71.99 (8 days) |
| London Luton (LTN) | £7 / 10 min, then £1/min | Long Stay — 120 min free, shuttle | gate £210.00 (no pre-book in dataset) |
| Edinburgh (EDI) | £8.50 / 10 min, then £1/min (was £6) | — (no free drop-off; 30-min free area noted in news) | gate £300.00 (no pre-book in dataset) |
| Birmingham (BHX) | **Free first 10 min**, then standard tariff | Drop Off car park — first 10 min free, no return within 1 hr | gate £301.00 (Car Park 7, no pre-book in dataset) |
| Glasgow (GLA) | £6 / 15 min, then £1/min (£50 over 30 min) | Long Stay — 60 min free, shuttle | **gate £140.00 vs pre-book £49.99 → ~£90 saved** |
| Bristol (BRS) | £8.50 / 10 min (was £7, raised 5 Jan 2026) | Waiting Zone — 60 min free, shuttle every 15 min | gate £240.00 (no pre-book in dataset) |
| Inverness (INV) | **Free first 15 min** (Short Stay) | Free Drop Off — 15 min free, 5-min walk | — (not in parking dataset) |

Airports present in `drop-off-fees.json` but not yet in `parking-tariffs.json` (Newcastle, Liverpool, London City, Leeds Bradford, East Midlands, Aberdeen, Belfast City/International, Southampton, Cardiff, Exeter, Southend, Bournemouth, Norwich, Teesside): use the drop-off template only and say parking isn't covered yet rather than guessing a figure.

**Recent changes worth citing (`news.json`, verified 2026-06-12):**
- Edinburgh — drop-off raised £6 → £8.50 from 18 May (`edinburgh-dropoff-fee-may-2025`).
- Bristol — Drop Off & Pick Up raised £7 → £8.50 from 5 Jan 2026 (`bristol-dropoff-fee-jan-2026`).
- Manchester / Birmingham / East Midlands / Stansted / Luton — barrier-free ANPR (pay online by midnight next day).
- London City — drop-off charge introduced 6 Jan 2026 (£8 / 5 min).

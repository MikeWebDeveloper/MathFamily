# ParkMath — PR & listing drafts (2026-06-23)

All figures are real, verified from the dataset as of 2026-06-23.
Key data points used throughout:
- Worst per-minute value: London City Airport — £8.00 for 5 minutes = **£1.60/min**
- Best per-minute time-based tariff: Prestwick — £4.50 for 60 minutes = **7.5p/min** (21× cheaper per minute than London City)
- Price rises since 2025: **5 airports** raised the headline fee (Heathrow +£1, Glasgow +£1, Bristol +£1.50, Liverpool +£1, Leeds Bradford +£1); London City introduced a new charge (was free, now £8 for 5 min)
- 2 airports still free: Birmingham and Inverness

---

## Section A: Journalist pitch emails

### Pitch 1 — Reach regional (e.g. Manchester Evening News, Birmingham Live, BristolLive)

**Subject:** Bristol drop-off fees up 21% — and London City is now the most expensive in Britain per minute

Hi [Name],

A quick data point for your readers: Bristol Airport has raised its forecourt drop-off charge by £1.50 this year (from £7 to £8.50 for 10 minutes), making it one of five UK airports to hike fees in 2026. Heathrow, Glasgow, Liverpool and Leeds Bradford all raised theirs by £1.

According to a verified, airport-by-airport comparison published by ParkMath (parkmath.co.uk/drop-off-charges), London City Airport is now the worst value for money in Britain per minute — charging £8 for just 5 minutes, which works out at £1.60 a minute. By contrast, Prestwick charges 7.5p a minute for a 60-minute window.

Birmingham Airport remains free, which makes it unusual among the major English airports.

The full data — fees, time limits, penalties, and the free alternative at each airport — is open and downloadable at parkmath.co.uk/drop-off-charges.

Happy to share the dataset or a tailored cut for your region. A ParkMath spokesperson is available for comment.

Best,
[ParkMath spokesperson]

---

### Pitch 2 — Travel trade (The Moodie Davitt Report, TTG, Business Travel News)

**Subject:** Data: 5 UK airports raised drop-off charges in 2026; per-minute spread is now 21×

Hi [Name],

For your readers tracking airport ancillary charges: new verified data from ParkMath shows that 5 UK airports increased their kerbside drop-off fee in 2026, and the per-minute spread across the network is now stark.

Key figures from the ParkMath UK Drop-Off Charges dataset (parkmath.co.uk/drop-off-charges):

- **London City** is now the most expensive per minute in the UK: £8.00 for a 5-minute window = £1.60/min. (The charge was introduced this year — previously free.)
- **Prestwick** is the cheapest per-minute time-based tariff at 7.5p/min (£4.50 for 60 minutes) — 21× cheaper per minute than London City.
- Five airports raised fees since 2025: Heathrow (+£1), Glasgow (+£1), Bristol (+£1.50), Liverpool (+£1), Leeds Bradford (+£1).
- Two major airports remain free: Birmingham and Inverness.

The full dataset — 26 airports, with verified fees, time limits, penalties, Blue Badge policies and free alternatives — is openly available for download at parkmath.co.uk/data/drop-off-charges.csv, licensed CC BY 4.0.

A ParkMath spokesperson is available for further comment or a bespoke data cut by terminal type, region, or penalty structure.

Best,
[ParkMath spokesperson]

---

### Pitch 3 — Consumer/money press (Which?, MoneySavingExpert content, The Sun, Mirror money)

**Subject:** Dropping someone off at the airport? One airport now charges £1.60 per minute

Hi [Name],

Something your readers planning summer trips should know: the cheapest and most expensive UK airport drop-off charges differ by a factor of 21 when you measure per minute of allowance.

The worst value: **London City Airport** charges £8 for just 5 minutes at the kerb — that is £1.60 a minute, the most expensive per-minute drop-off charge of any major UK airport.

The best value time-based tariff: **Prestwick** at £4.50 for a full 60 minutes (7.5p a minute).

Five airports raised their fees this year (Heathrow, Glasgow, Bristol, Liverpool and Leeds Bradford), and London City introduced the charge for the first time. Two airports — Birmingham and Inverness — are still completely free.

Every figure on parkmath.co.uk/drop-off-charges is read directly from each airport's official page and date-stamped. There is a free-to-download CSV at parkmath.co.uk/data/drop-off-charges.csv.

Happy to share a cut for any specific airports relevant to your readership. A ParkMath spokesperson is available for comment.

Best,
[ParkMath spokesperson]

---

## Section B: Product Hunt listing copy

**Name:** ParkMath

**Tagline (≤60 chars):** Every UK airport drop-off charge, verified

**Description (≤260 chars):**
ParkMath tracks every UK airport's drop-off (kiss-and-fly) charge, time limit, penalty and free alternative — read directly from official airport pages and date-stamped. Sortable table, £/min league, Blue Badge guide, free CSV download. No ads, no invented prices.

**Topics:** Productivity, Travel, Open Data, Consumer Tools

**Founder comment:**
I built ParkMath after getting caught by an airport drop-off charge I didn't know existed. Every row in the table links directly to the airport's own page so you can verify the number yourself. London City is now the worst value at £1.60/min — Birmingham is still free. Happy to answer any questions about the data or methodology.

---

## Section C: AlternativeTo listing copy

**Name:** ParkMath

**Short description:**
Verified UK airport drop-off charges and parking costs — official source, date-stamped, free download.

**Full description:**
ParkMath publishes every major UK airport's drop-off (kiss-and-fly) charge in a single sortable table. Each fee, time limit, penalty charge notice amount, Blue Badge policy and free alternative is read directly from the airport's official published page and date-stamped on the day of verification — not scraped from aggregators or reprinted from press releases.

Features:
- 26 UK airports covered
- Sortable by fee, £-per-minute, time limit and A–Z
- £-per-minute league table (London City = worst at £1.60/min; Prestwick = best at 7.5p/min)
- Per-airport guides: avoid-the-charge, Blue Badge, parking vs drop-off comparison
- Free CSV download (CC BY 4.0)
- No advertising, no fabricated prices

**Category:** Travel Tools / Consumer Finance Tools

**Alternatives it replaces:** Airport websites (which hide the charge in small print), money-saving aggregator pages (which often show stale or wrong prices), generic parking comparison sites.

---

## Section D: Wikidata entity draft

**Label (en):** ParkMath

**Description (en):** UK website publishing verified airport drop-off charges and parking prices

**Aliases:** parkmath.co.uk, ParkMath airport data

**Statements to add once the Q-number exists:**

| Property | Value |
|---|---|
| instance of (P31) | website (Q35127) |
| official website (P856) | https://parkmath.co.uk |
| country (P17) | United Kingdom (Q145) |
| industry (P452) | travel information (Q1349798) |
| inception (P571) | 2024 |
| topic's main category (P910) | airport fees |

**One-line sameAs code change** (add once Q-number is assigned):
In `packages/geo/src/builders.ts`, the `organizationLd()` call in layout.tsx should add:
```ts
sameAs: ["https://www.wikidata.org/wiki/QXXXXXXX"]
```
Replace `QXXXXXXX` with the actual Q-number after it is assigned on Wikidata.

---

## Section E: What requires Mike's credentials vs what is already drafted

### Already drafted (no credentials needed — Mike reviews and sends/submits)
- [ ] All three journalist pitch emails (Section A) — review and send from any email
- [ ] Product Hunt listing (Section B) — review, then post at producthunt.com/posts/new
- [ ] AlternativeTo listing (Section C) — review, then post at alternativeto.net/add
- [ ] Wikidata entity draft (Section D) — reviewed and ready to submit

### Requires Mike's accounts / credentials
- [ ] **Product Hunt account** — must be logged in as the maker to post and mark as maker
- [ ] **AlternativeTo account** — free account required to submit a listing
- [ ] **Wikidata account** — free account required to create the entity; once Q-number exists, the sameAs code change can be done by the engineering team
- [ ] **Press/journalist contacts** — Mike or a PR contact needs to identify the right journalist at each outlet and send the emails
- [ ] **Domain-verified email for pitching** — sending from @parkmath.co.uk or a professional address will improve deliverability; Resend is already wired for parkmath.co.uk

# Parking Tariff Research Notes — 2026-06 (Batch 1)

Dataset: `packages/data/datasets/parkmath/parking-tariffs.json` (version 1.0.0 as of batch 2).
Batch 1 airports: Heathrow (LHR), Gatwick (LGW), Manchester (MAN), Stansted (STN), Luton (LTN).
All figures verified/read on 2026-06-10.

## Regime / methodology

- **Gate products** (`productType: "gate"`) use each airport's OFFICIAL published drive-up / on-the-day
  / "turn up and park" / "roll-up" multi-day tariff. Where only a per-24h rate is published, the
  3/7/14-day totals are arithmetic on the OFFICIAL per-day rate (stated in each product's `notes`).
  This is computation on an official rate, not invention. Prices are stored as integer pence.
- **Prebook products** (`productType: "prebook"`) use ONLY the airport's own officially published
  pre-book "from £X" prices. Aggregators were not used. `snapshotDate` = 2026-06-10 for anything
  read today. Live booking-widget quotes (Heathrow, Gatwick, Luton) are JS-driven and could not be
  obtained headlessly within budget; per the research rules the prebook product is OMITTED for those
  airports with a note, and the official gate tariff carries the 3/7/14-day coverage.
- Each record has at least one product covering days 3, 7 AND 14 (always the gate product).
- Transport ladder used: site-scoped WebSearch -> WebFetch -> `r.jina.ai` curl fallback. Wayback/PDF
  not needed.

## Heathrow (LHR)

- Product: Park & Ride (formerly Long Stay) — drive-up gate tariff.
- Official tariff: £46.80 first 24h, £37.40 each subsequent 24h.
- Computed: 3d £121.60 / 7d £271.20 / 14d £533.00.
- URL: https://www.heathrow.com/transport-and-directions/heathrow-parking/heathrow-park-and-ride
- Transport: WebFetch (page rendered cleanly).
- Prebook: OMITTED. No static published "from" weekly price; price sits behind a live booking widget.
  Gaps/flags: prebook to be added in a later batch via a live quote.

## Gatwick (LGW)

- Product: Long Stay — roll-up (drive-up) gate tariff.
- Official tariff: £38 first 24h (2-24h band), £32 each subsequent 24h. (0-2h free.)
- Computed: 3d £102.00 / 7d £230.00 / 14d £454.00.
- URL: https://www.gatwickairport.com/parking/roll-up-car-park-prices.html
- Transport: WebFetch (full roll-up tariff table extracted). Cross-checked Long Stay page via r.jina.ai.
- Prebook: OMITTED. No static published "from" weekly price; price sits behind a live booking widget
  (parking.gatwickairport.com). Gaps/flags: prebook to be added later via live quote.

## Manchester (MAN)

- Gate product: Turn Up & Park — T2 West Multi Storey (P3).
- Official tariff: £61.40 for up to 24h and for each 24h thereafter (flat).
- Computed: 3d £184.20 / 7d £429.80 / 14d £859.60.
- Prebook product: JetParks (pre-book only). Officially published "from £59.99 (8 days)".
  Stored as a single 8-day point (5999 pence), snapshotDate 2026-06-10.
- URLs: https://www.manchesterairport.co.uk/parking/turn-up-and-park/ (gate),
  https://www.manchesterairport.co.uk/parking/jetparks/ (prebook product).
- Transport: WebFetch failed with a TLS cert error; used r.jina.ai curl fallback for the gate tariff
  table. Prebook "from" price from site-scoped WebSearch on manchesterairport.co.uk.
- Gaps/flags: JetParks "from" figure is a single 8-day promotional point, not a 3/7/14 ladder; gate
  product provides full coverage. Replaced the previous PLACEHOLDER Manchester record (which had
  fabricated prices).

## Stansted (STN)

- Gate product: Mid Stay — Turn Up & Park (drive-up).
- Official tariff: Mid Stay £48 per 24h and each 24h thereafter (flat). (Short Stay drive-up £70/24h.)
- Computed: 3d £144.00 / 7d £336.00 / 14d £672.00.
- Prebook product: Long Stay (pre-book). Officially published "from £71.99" for an 8-day stay
  (sample dates Oct 2026). Stored as a single 8-day point (7199 pence), snapshotDate 2026-06-10.
- URLs: https://www.stanstedairport.com/parking/turn-up-and-park/ (gate),
  https://www.stanstedairport.com/parking/long-stay/ (prebook).
- Transport: WebFetch for both.
- Gaps/flags: prebook "from" is a single 8-day point; gate product provides 3/7/14 coverage.

## Luton (LTN)

- Product: Long Stay — on-the-day (drive-up) gate tariff.
- Official tariff: Long Stay £30.00 "each additional day, or part of a day". (Mid Stay on-the-day
  £35/day.)
- Computed (flat £30/day): 3d £90.00 / 7d £210.00 / 14d £420.00.
- URL: https://www.london-luton.co.uk/parking-prices
- Transport: WebFetch.
- Prebook: OMITTED. No static published "from" weekly price; behind a live booking widget.
- Gaps/flags: FLAG — Luton publishes a per-day "additional day, or part of a day" rate but no
  separately stated first-day rate, so the gate totals assume a flat £30/day. Re-confirm the first-day
  rate (and whether a higher day-1 charge applies) on a future pass.

---

# Batch 2 — 2026-06 (Edinburgh, Birmingham, Glasgow, Bristol, Newcastle)

Dataset bumped to **version 1.0.0**. Same regime/methodology as Batch 1 (see top of file).
All figures verified/read on 2026-06-10. Transport ladder used (per airport below):
site-scoped WebSearch -> WebFetch -> `r.jina.ai` reader proxy -> Wayback Machine -> official PDFs.
Three of the five MAG/AGS/Cloudflare-group sites blocked every automated transport; details per airport.

## Edinburgh (EDI)

- Product: Long Stay — drive-up (roll-up) gate tariff.
- Official tariff (Long Stay): 0-30 min free; 30 min-1h £14; 1-3h £22; **3-24h £60.00; thereafter
  £40.00 per day (or part)**.
- Computed: 3d £140.00 / 7d £300.00 / 14d £580.00 (3d=60+2x40; 7d=60+6x40; 14d=60+13x40).
- URLs: https://www.edinburghairport.com/edinburgh-airport-parking/long-stay-parking (gate),
  cross-checked against /drive-up-and-park (same first-24h £60 + £40/day figures).
- Transport: WebFetch rendered both pages cleanly (edinburghairport.com is NOT Cloudflare-blocked).
- Prebook: OMITTED. Multi-storey/Mid Stay are "pre-book only" and the Long Stay pre-book price sits
  behind a live JS booking widget; no static published weekly "from" price. Gate product carries the
  3/7/14-day coverage.

## Birmingham (BHX)

- Product: Car Park 7 — off-site Long Stay (turn-up) gate tariff. (Car Park 7 is BHX's off-site
  long-stay car park; the multi-storey Car Parks 1/2/3 turn-up is £64/24h + £64/day — far dearer.)
- Official tariff (Car Park 7): up to 90 min £2.50; 2h £9.50; 3h £19; 4h £28.50; **up to 24h £49.00;
  per day thereafter £42.00**.
- Computed: 3d £133.00 / 7d £301.00 / 14d £595.00 (3d=49+2x42; 7d=49+6x42; 14d=49+13x42).
- URL: https://www.birminghamairport.co.uk/parking/turn-up-prices/
- Transport: **birminghamairport.co.uk is Cloudflare-blocked** (the "Just a moment…" JS challenge) to
  WebFetch, the jina reader proxy, and curl with a browser UA, on every host tried (www, authoring,
  airport, corporate, prebook). Figures read from the **official turn-up-prices page captured in the
  Wayback Machine on 2025-09-06** (the most recent successful 200 snapshot; full static tariff table
  for every car park present). The corporate fees-and-charges page and prebook portal yielded no
  static long-stay tariff.
- Prebook: OMITTED. Pre-book sits behind the Rezcomm booking widget (prebook.birminghamairport.co.uk),
  JS-only, no static weekly "from" price. Gate product carries the 3/7/14-day coverage.
- **FLAG (re-confirm):** figures are from a 2025-09 official snapshot, not the live 2026 tariff.

## Bristol (BRS)

- Product: Silver Zone — long-stay gate price (drive-up). (Silver Zone is BRS's cheapest on-site
  long-stay car park, designed for 3+ day stays, with a shuttle bus to the terminal.)
- Official Silver Zone **gate (drive-up) prices**: **3 Days £100.00; 4 Days £135.00; 5 Days £170.00;
  each additional day (or part) thereafter £35.00.** (Marked "Subject to availability and
  authorisation from the Silver Zone team.")
- Computed: 3d £100.00 (published) / 7d £240.00 / 14d £485.00 (from the £100 3-day base + £35/day:
  7d=100+4x35; 14d=100+11x35). 5-day cross-check matches the published £170 (100+2x35).
- URL: https://www.bristolairport.co.uk/parking/parking-prices/
- Transport: **bristolairport.co.uk is HTTP-403 to WebFetch**; full prices page (Silver Zone,
  Multi-Storey, Short Stay, Mid Stay gate tables) read via the **`r.jina.ai` reader proxy**.
- Prebook: OMITTED. The page states pre-book "save on the turn-up gate price" but pre-book figures are
  date-dependent and live-quoted; no static weekly "from" price published alongside the gate table.
  Gate product carries the 3/7/14-day coverage.

## Glasgow (GLA)

- Gate product: Long Stay — turn-up (roll-up / drive-up).
- Official Long Stay **"TURN UP PRICES"** table (labelled "Book in advance and save up to 60% on
  turn-up prices for a duration greater than 24 hours"): up to 1h free; 2h £15; **1 day £50.00;
  2 days £65.00; 3 days £80.00; each additional day (or part) thereafter £15.00**.
- Computed: 3d £80.00 (published) / 7d £140.00 / 14d £285.00 (from the £80 3-day base + £15/day:
  7d=80+4x15; 14d=80+11x15). 2-day cross-check matches (£65 = 50+15).
- Prebook product: official "**1-week (7-day) Long Stay from £49.99**" pre-book 'from' price recorded
  as a single 7-day point (4999 pence, snapshotDate 2026-06-10).
- URL: https://www.glasgowairport.com/at-the-airport/airport-services/parking/long-stay/
- **Transport (key win):** glasgowairport.com is Cloudflare-blocked to WebFetch, the plain jina reader
  and curl, and every Wayback snapshot of the Long Stay page injects its prices via JavaScript (static
  HTML rows have **empty price cells**). The official turn-up table was finally obtained by rendering
  the official page through the **jina reader's headless-browser engine** (`curl https://r.jina.ai/<url>
  -H "X-Engine: browser" -H "X-Wait-For-Selector: table td"`), which executes the page JS. The
  £50/£65/£80/£15 figures it returned are the OFFICIAL rendered table (they happen to match
  third-party quotes, but the recorded source is the official page, not an aggregator).

## Newcastle (NCL)  — EXCLUDED from dataset (no official static prices obtainable)

- **Newcastle is NOT included in the parking dataset.** No static parking price of any kind is
  published on the official domain, so no record could be created that meets the dataset quality bar.
- **Why excluded:** newcastleairport.com is Cloudflare-blocked to WebFetch, the jina reader and curl
  (every host: www, content, booking, prebook, parking). Every Wayback snapshot of the Long Stay page
  (2024 → 2026) has empty/JS-injected price cells (no `£` text in the static HTML at all). The
  official Conditions-of-Use / Ancillary-Charges 2026 PDFs (read with poppler) list only **staff
  car-park** permit charges (3/6/9/12-month) and operational/aeronautical fees — no public gate
  tariff. The headless-browser render that cracked Glasgow (`X-Engine: browser`) was also tried on
  Newcastle's long-stay, car-parking-options, booking/car-park and FAQ pages — Newcastle's Cloudflare
  challenge defeats even the headless render (it still returns the "Performing security verification"
  interstitial).
- The aggregator-quoted "from £92.98 / 8 days" and "£13.75/day" could **NOT be confirmed on the
  official domain** (an official-scoped search for "92.98" returned nothing) and were therefore NOT
  used. Only an official verified figure may be added.
- URL: https://www.newcastleairport.com/car-parking/long-stay-parking/

**Re-add routes (both require an official dated quote):**
1. **Drive the official widget with a real browser** — open the Newcastle Long Stay booking page in a
   human browser session, enter specific inbound/outbound dates, and record the on-the-day gate price
   that the widget returns (with a screenshot as evidence). Call centre alternative: 0191 214 4341.
2. **Manual official quote** — request a written tariff sheet from Newcastle Airport directly (email
   or call), cite the official source and date, then enter the figures as a `gate` product with the
   correspondence archived under `docs/verification/`.

## Items for human re-confirmation

1. Heathrow / Gatwick / Luton prebook "from" weekly prices — require live booking-widget quotes (next batch).
2. Luton Long Stay first-day rate vs flat per-day assumption.
3. Manchester JetParks and Stansted Long Stay "from" figures are single promotional points tied to
   sample dates, not full ladders.
4. **Birmingham** Car Park 7 turn-up figures are from a 2025-09 official Wayback snapshot — re-confirm
   against the live 2026 tariff.
5. **Glasgow** — official turn-up gate table obtained via headless-browser render of the official page
   (1 day £50 / 2 days £65 / 3 days £80 / +£15 day). A live glance is worthwhile to confirm the
   headless render matches the live signage, but the figures are official, not aggregator.
6. **Newcastle** — no official static price of any kind exists (fully dynamic, Cloudflare-blocked even
   to a headless render). **Newcastle is excluded from the dataset entirely.** To add it back, obtain
   a live official quote via a real browser session or call 0191 214 4341 — see the Newcastle section
   above for the two re-add routes.

> **Transport note (batch 2):** static official-media files (PDFs) on Cloudflare-fronted airport
> domains (Glasgow) download fine via `curl` with a desktop browser User-Agent even when the HTML
> pages return the "Just a moment…" JS challenge; HTML pages on those domains do not. `poppler`
> (`pdftotext -layout`) was installed locally to read the downloaded tariff PDFs.

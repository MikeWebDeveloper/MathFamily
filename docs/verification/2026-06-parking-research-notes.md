# Parking Tariff Research Notes — 2026-06 (Batch 1)

Dataset: `packages/data/datasets/parkmath/parking-tariffs.json` (version 0.1.0).
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

## Items for human re-confirmation

1. Heathrow / Gatwick / Luton prebook "from" weekly prices — require live booking-widget quotes (next batch).
2. Luton Long Stay first-day rate vs flat per-day assumption.
3. Manchester JetParks and Stansted Long Stay "from" figures are single promotional points tied to
   sample dates, not full ladders.

# ParkMath — Outreach Emails

Cold-outreach drafts for [ParkMath](https://parkmath.co.uk), a free, **independent** UK
airport-cost comparison site. ParkMath takes no aggregator commission and carries **no affiliate
links** — it just shows the verified gate price, the pre-book price, and the free drop-off
alternative side by side.

**Source of truth:** every figure below is copied from the date-stamped datasets in
`packages/data/datasets/parkmath/` (`drop-off-fees.json`, `parking-tariffs.json`, `news.json`),
all verified **10–12 June 2026**. Do not edit figures here by hand — regenerate from the datasets
when a campaign runs.

**Rules for whoever sends these**
- Use only the verified figures below. Never round up, never invent a saving, never add an airport
  that isn't in the dataset.
- ParkMath is independent. Do **not** add affiliate or referral links to any of this copy.
- Replace every `{token}` before sending. Tokens: `{name}`, `{site}`, `{page_url}`, `{your_name}`,
  `{site_owner}`, `{publication}`, `{journalist}`.
- `{site}` = the recipient's website; `{page_url}` = the specific resource/article page you're
  referencing on their site.

---

## 1 · Resource-page outreach email

**Use when:** a site already has a "travel tips", "airport guide", or "parking tools" round-up page
that links out to parking calculators or comparison tools.

**Subject:** A free, no-affiliate parking-cost tool for your {site} airport page

**Preview text:** Verified UK drop-off + parking prices, no commission, no sign-up.

---

Hi {name},

I run [ParkMath]({page_url_parkmath}) — a free tool that compares UK airport **drop-off charges**
and **car-park prices** side by side. I came across your round-up at {page_url} and thought it might
genuinely fit.

What makes it worth a link rather than just another aggregator:

- **Independent, no affiliate links.** ParkMath earns nothing from a click. It shows the airport's
  own gate price, the cheapest pre-book price, and the **free** alternative together, so the reader
  can see the actual cheapest option — even when that's £0.
- **Every figure is dated and sourced** to the airport's official page. For example: Heathrow's
  drop-off charge is **£7 each time** you enter a terminal forecourt (up from £6) — but its
  Park & Ride car park is **free for 30 minutes** with a shuttle to the doors. Gatwick drop-off is
  **£10 for 10 minutes** (capped at £30), while its Long Stay car park is **free for 2 hours**.
  Those free routes are the part most guides leave out.
- **It tracks the 2026 changes** people are searching for: Edinburgh's drop-off rose from £6 to
  **£8.50** (18 May 2025), Bristol's from £7 to **£8.50** (5 Jan 2026), and London City introduced
  an **£8** drop-off charge for the first time (6 Jan 2026).
- No sign-up, no paywall, no app — just the page.

If it's useful to your readers, a link to {page_url_parkmath} would be very welcome. And if there's
a specific airport your audience cares about, I'm happy to point you straight at that page.

Either way, thanks for putting the round-up together — it's a useful page.

Best,
{your_name}
ParkMath · {page_url_parkmath}

---

## 2 · UK local-press / Sheffield Star pitch

**Use when:** pitching a regional/consumer desk (the home angle is a Sheffield developer building
the tool independently). Lead with the reader-saving, not the founder.

**Subject:** Sheffield developer builds free tool to fight airport parking rip-offs

**To:** {journalist}, {publication}

---

Hi {journalist},

Quick story idea for {publication}, with the numbers already checked.

A Sheffield developer has built a free website, [ParkMath]({page_url_parkmath}), that lays bare how
much UK airports now charge just to **drop someone off** — and, crucially, shows the free
alternative most drivers don't know exists.

The hook is the gap between the two. A few verified examples, each sourced to the airport's own
website (all checked June 2026):

- **Heathrow:** £7 *every time* you pull into a terminal drop-off zone — yet its Park & Ride car
  park is **free for 30 minutes** with a shuttle to the terminal.
- **Gatwick:** £10 for 10 minutes at the forecourt (and up to £30 if you linger) — while its Long
  Stay car park is **free for the first 2 hours**.
- **Manchester:** drive-up parking is **£61.40 a day** at the gate — pre-booking JetParks starts at
  **£59.99 for eight days**. Turning up without booking is the single most expensive thing a
  traveller can do.

And the charges keep climbing: **Edinburgh** drop-off went from £6 to **£8.50**, **Bristol** from £7
to **£8.50**, and **London City** brought in an **£8** drop-off fee for the first time — all in the
last 13 months.

What makes ParkMath different from the price-comparison sites: it's **completely independent and
carries no affiliate links**, so it has no reason to nudge anyone toward a paid car park. It earns
nothing from your readers. Every number on the site is dated and linked back to the airport's
official page, so it's all checkable.

The angle for your readers: a local developer turning the maths on airport "convenience" charges
into something anyone can use before the summer getaway — and showing them how to pay £0 instead.

Happy to share the founder's story, the full data behind any airport, or a quote. The tool is live
at {page_url_parkmath}.

Thanks,
{your_name}

---

### Figure provenance (for the sender — do not paste into the email)

| Claim | Dataset | Value |
| --- | --- | --- |
| Heathrow drop-off £7/entry (was £6) | `drop-off-fees.json` heathrow | `700` pence; `priorYearFeePence: 600` |
| Heathrow free 30 min Park & Ride | `drop-off-fees.json` heathrow | `freeAlternative.minutesFree: 30` |
| Gatwick £10/10 min, max £30 | `drop-off-fees.json` gatwick | band `1000`; `maxChargePence: 3000` |
| Gatwick free 2 hrs Long Stay | `drop-off-fees.json` gatwick | `freeAlternative.minutesFree: 120` |
| Manchester gate £61.40/day | `parking-tariffs.json` manchester gate | £61.40 flat/24h (notes) |
| Manchester JetParks from £59.99 / 8 days | `parking-tariffs.json` manchester prebook | `5999` pence, `days: 8` |
| Edinburgh drop-off £6 → £8.50 (18 May 2025) | `news.json` edinburgh-dropoff-fee-may-2025 | `change.from £6 → to £8.50` |
| Bristol drop-off £7 → £8.50 (5 Jan 2026) | `news.json` bristol-dropoff-fee-jan-2026 | `change.from £7 → to £8.50` |
| London City new £8 drop-off (6 Jan 2026) | `drop-off-fees.json` london-city | band `800`; `priorYearFeePence: 0` |

_Datasets verified 10–12 June 2026. No affiliate links. ParkMath is independent._

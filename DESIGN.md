# Math Family — Design Brief

*Stitch design-system pass (the refinement deferred in the P1/P2 specs). Evolves the
existing shared fintech-clarity system in `packages/ui` — it does not replace it.
Showcased through ParkMath (the flagship brand); RoamMath swaps the brand tokens to
teal via the same `@theme` override mechanism.*

## Product

A family of UK cost-calculator sites — ParkMath (airport drop-off, parking, lounges)
and RoamMath (roaming, eSIM, baggage) — that answer "what does this actually cost?" with
verified, date-stamped numbers from official sources. The reader is a stressed Brit
about to travel, often on a phone, wanting one trustworthy number fast. It must feel
like a calm financial instrument: precise, current, never salesy. The brand promise is
trust through verifiable data, so every screen wears its sources and its "verified on
[date]" stamp openly.

## Style direction

**Trust & Authority** (ui-ux-pro-max). Data-first, not decoration-first. The hero of
every page is the answer — one big number, instantly. Trust signals (a green
"Verified 10 Jun 2026" pill, a dotted-underline source link, a "Sources & method" block)
are first-class UI, not footnotes. Restrained: one brand colour, generous whitespace,
crisp hairline borders, subtle elevation on cards. No gradients-as-decoration, no AI
purple/pink, no stock photography. The feeling sits between Monzo's friendliness and the
ONS's authority — approachable numbers you can stake a travel budget on.

## Mode & device

- Color mode: **light** (answer-first GEO pages live in light mode; dark mode is a later phase)
- Device: **desktop** (responsive down to 375px mobile — most real traffic is mobile)

## Color palette

Shared family axis = "trust + professional". ParkMath is the primary instance.

- Primary (brand): **#0A2540** (ParkMath deep navy — authority)
- Accent / CTA: **#2563EB** (clear action blue)
- Neutral/background: **#F8FAFC** (cool off-white surface) on **#FFFFFF** cards
- Ink: **#0F172A** headings · **#475569** muted body
- Semantic: success/verified **#16A34A**, warning/penalty **#B45309**, error **#DC2626**
- Sibling brand (RoamMath, token override only): primary **#134E4A** teal, accent **#0D9488**

## Typography

- Headlines: **IBM Plex Sans** — 600/700 weight. Engineered, trustworthy, "made for data."
- Body: **IBM Plex Sans** — 400/500, 16px base, line-height 1.5.
- Numbers / fees / tables: **IBM Plex Mono** with tabular figures — the big fee number,
  every price in a comparison table, every calculator output. This is the signature move:
  monospaced figures read as *measured data*, not marketing copy, and never shift layout.
- Type scale: 12 · 14 · 16 · 20 · 24 · 32 · 48 · 64 (the headline fee renders at 48–64).
- Exact pairing intent (verbatim, even if Stitch enum-maps both to IBM_PLEX_SANS):
  **IBM Plex Sans** (headings + body) + **IBM Plex Mono** (all numeric/tabular data).

## Shape & spacing

- Corner radius: **12px** on cards and inputs (tightened from the old 16px — more precise,
  instrument-panel feel; still soft enough to feel modern-consumer, not brutalist).
  Pills (freshness badge) stay fully rounded.
- Spacing rhythm: **4px base grid** (4 · 8 · 12 · 16 · 24 · 32 · 48 · 64).

## Depth, motion & scroll (the elevation Mike asked for)

The current build renders correctly but feels flat. This pass adds real depth and life
while staying on the trust-first side of the line (never gimmicky):

- **Layered elevation, not flat outlines.** Replace the wall of thin-bordered boxes with
  real cards: white surface, a soft two-stop shadow (`0 1px 2px` + `0 8px 24px` at low
  opacity), hairline border only as a crisp edge. Three elevation tiers — resting card,
  raised (hover), and the brand "hero" card (navy fee stat) with a deeper coloured shadow.
- **Hover life.** Cards and grid links lift 2px and deepen their shadow on hover
  (transform + box-shadow, 180ms ease-out); the cheapest/"winner" option gets a subtle
  brand-tinted ring. Everything clickable shows `cursor: pointer` and a visible focus ring.
- **Micro-animations (meaningful, not decorative).** Calculator outputs count/crossfade
  when the slider moves; the verified pill does a one-time gentle fade-in; cards in a grid
  stagger-reveal on scroll (30–50ms each); the savings callout slides+fades in. All ≤300ms,
  transform/opacity only, fully disabled under `prefers-reduced-motion`.
- **Generous scroll rhythm.** Looser vertical spacing between sections (48–64px), a sticky
  translucent header that gains a shadow on scroll, section dividers with breathing room,
  and on long pages a thin scroll-progress indicator. The page should feel like a calm,
  paced reveal — not one dense screen.
- **Richer cards specifically:** the airport grid becomes hover-lift cards showing the airport
  name + its headline fee together (not bare text links); FeeStat hero cards gain an inner
  highlight and the big mono number; comparison rows get zebra + row-hover; the
  free-alternative and savings callouts get a tinted surface, an icon, and a soft glow.
- Elevation: resting cards use the two-stop soft shadow + 1px hairline border (`#0f172a` ~8%);
  the answer-lead block carries a 4px brand-colour left rule and a faint surface tint.

## UX rules for this product

- Contrast ≥ 4.5:1 for all text; the navy primary on white and white-on-navy both pass AAA.
- Touch targets ≥ 44px; calculator sliders and airport-grid links sized for thumbs.
- Visible focus rings (2px accent) on every interactive element; never removed.
- `prefers-reduced-motion` respected — number reveals and slider feedback degrade to instant.
- Tabular figures everywhere numeric so price columns never reflow as values change.
- Colour is never the only signal — the verified pill pairs green with the word "Verified";
  the savings callout pairs the tint with an explicit "saves £X" string.
- The answer is always in the first viewport, before the calculator — it must be readable
  with JavaScript off (the calculator only enhances).
- Sources are shown, not hidden: every data page ends with a "Sources & method" block.

## Screens

1. **ParkMath home** — answer-first hero ("What does it cost to *drop someone off* at a UK
   airport?"), prominent airport search field, three FeeStat cards (most-expensive £, airports
   charging, still-free), "compare all in one table" CTA, email-capture, family cross-link.
2. **Drop-off master table** — the sorted comparison: airport · fee · time limit · penalty ·
   free alternative · verified-date, headed by a freshness badge, with the Dataset framing
   ("verified against official airport pages, sorted by fee").
3. **Airport detail (richest screen)** — answer-lead block, the big FeeStat hero number
   (e.g. £10), trend note, free-alternative callout (the trust move), the drop-off calculator
   island (minutes slider → cost + warnings), penalty section, FAQ accordion, Sources & method.
4. **Parking comparison** — gate-vs-pre-book for an airport: the duration toggle calculator
   (1/3/7/14/28-day buttons), ranked option cards with the cheapest crowned, a "pre-booking
   saves £X" callout, the full options grid, official-site affiliate slot.
5. **Lounge break-even** — the visits-per-year slider, pay-as-you-go vs Priority Pass tiers,
   and the plain-English verdict ("Standard Plus membership wins — saves £X/year").

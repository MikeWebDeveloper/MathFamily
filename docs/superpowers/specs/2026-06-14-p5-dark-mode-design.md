# P5 — Dark Mode (+ premium-depth finish)

*The premium depth/motion kit already shipped (`tokens.css`: `mf-edge`, `mf-sheen`, `mf-glint`,
`mf-edge-shine`, `mf-glow-winner`, `AnimatedNumber`, scroll-reveal, ambient-backdrop). The
remaining P5 work is **dark mode**, enabled by the token split the program spec parked here, plus a
colour-blind-safe winner cue. Light mode must stay the default and visually unchanged.*

## Mechanism (token-flip, not per-component `dark:`)
Theming is Tailwind v4 `@theme` CSS variables in `packages/ui/src/tokens.css` (apps override
`--color-brand` etc. in their `globals.css`). Components consume `var(--color-*)` via utilities
(`text-ink`, `bg-surface`, `bg-brand`, …). So dark mode = override those variables under
`[data-theme="dark"]`. The catch: cards use the **literal `bg-white`**, which can't be flipped — so:

1. **Add a card surface token.** In `tokens.css` `@theme`, add `--color-card: #ffffff;` (light). In
   light mode `bg-card` === `bg-white`, so migrating `bg-white` → `bg-card` is a **no-op visually**.
2. **Migrate `bg-white` → `bg-card`** across `packages/ui/src/*` and the apps' components/pages
   (grep for `bg-white`; also check inline `#fff`/white literals on card surfaces). Leave genuinely
   always-white things (e.g. white text on the navy brand surface) alone.
3. **Add the dark override block** in `tokens.css` (after `@theme`):
   ```css
   [data-theme="dark"] {
     --color-surface: <dark page bg>;
     --color-card: <dark card surface>;
     --color-ink: <near-white>;
     --color-ink-muted: <muted light>;
     /* brand stays navy/teal (still reads on dark); accent stays */
   }
   ```
   Pick values meeting WCAG AA (≥4.5:1 body text). Also provide dark-aware `--shadow-card`/`-raised`
   (shadows are invisible on dark — use a subtle light ring/deeper shadow) and confirm the
   `.mf-*` decorative classes (grid/blobs/edges using `rgb(15 23 42 / α)`) still read in dark; add
   `[data-theme="dark"]` tweaks where they vanish.
4. **`@custom-variant dark`** in `tokens.css` so any necessary `dark:` utility works:
   `@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));` — use `dark:` only
   where the token-flip is insufficient (e.g. the navy tile/StatStrip surfaces, freshness pill).

## Toggle (no flash)
- A small **no-flash inline script** in the app `layout.tsx` `<head>` that, before paint, sets
  `document.documentElement.dataset.theme` from `localStorage.theme` else `prefers-color-scheme`.
- A `ThemeToggle` client component (`packages/ui/src/theme-toggle.tsx`) in `SiteHeader`: a 44px
  icon button (sun/moon, `aria-label`, `aria-pressed`) that flips `data-theme` on `<html>` and
  writes `localStorage.theme`. Respects `prefers-reduced-motion` (no transition fl- jank).

## Colour-blind-safe winner cue
The cheapest/"winner" already pairs the brand tint with a "Cheapest" label (good). Audit any
positive/negative signal that relies on hue alone (e.g. up/down deltas) and add an icon or word so
colour is never the only signal — small.

## Out of scope (P5b / follow-up)
- Per-component pixel polish in dark beyond AA legibility on the core pages.
- Dark variants of OG images / charts (SVGs render on their own bg).

## Acceptance
- **Light mode unchanged** (default; `bg-card`===white). Toggling to dark flips the whole UI with no
  white "islands" on the core pages (home, a drop-off/parking/lounge/roaming answer page, an index
  table). No flash on load. Choice persists; respects `prefers-color-scheme` first visit.
- WCAG AA contrast in dark on body text + key UI. Reduced-motion respected.
- `pnpm test`/`typecheck` green; both apps `next build`; routes stay static.

## Verification
Unit: `ThemeToggle` logic (jsdom — toggles `data-theme`, persists). e2e (Playwright): the toggle
sets `data-theme="dark"` and persists across reload. **Visual QA: the controller will screenshot the
home + an answer page + an index page in dark and check for white islands / unreadable text before
merging** (this is a YMYL site — dark must not ship broken).

## Branch
`design-upgrade-p5` off `main`. PR → screenshot-QA → merge when green + visually clean.

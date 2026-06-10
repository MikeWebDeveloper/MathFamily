# Math Family

UK cost-calculator portfolio monorepo. First brand: **ParkMath** (airport drop-off,
parking & lounge costs). Spec: `docs/superpowers/specs/2026-06-10-parkmath-roammath-design.md`.

- `apps/parkmath` — Next.js site
- `packages/engine` — pure-TS calculators (integer pence, typed warnings)
- `packages/data` — Zod schemas + JSON datasets (every record: sourceUrl + verifiedAt)
- `packages/geo` — JSON-LD builders for answer engines
- `packages/ui` — design tokens + shared components

Rules: prices change only via reviewed git diffs. Never auto-publish a price.

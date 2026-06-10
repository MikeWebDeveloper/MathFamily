# P4: Freshness Agent — Design Spec

*2026-06-10 · Approved through brainstorming with Mike. Supersedes the original "n8n
fetch → diff → PR" sketch in the family spec §6 P4 with an agent-based system, at
Mike's direction.*

## 1. Purpose and decisions

Stale data is the one thing that can kill the Math family's trust premium. P4 turns
the verification regime used to build P1–P3 (official-sources-only, transport ladder,
null-over-guess, research notes) into an automated system that keeps every dataset
fresh — and can adjust code when reality changes shape (a new tariff tier, a free
airport going paid).

**Decisions taken in brainstorming:**
- **Architecture: hybrid.** n8n on the Mac mini runs a cheap deterministic daily
  watchdog; a headless Claude Code agent does the real verification work, triggered
  by the watchdog or by a weekly schedule.
- **Autonomy: everything via PR.** The agent never touches `main`. Mike merges.
  This preserves the founding rule: never auto-publish a price.
- **Cadence: daily watchdog, weekly sweep**, plus the January full ritual
  (`sweep --full`).
- **Agent encoding: a repo-local Claude Code skill** (`.claude/skills/freshness/`)
  invoked headlessly (`claude -p`), not a standalone Agent SDK app — the playbook is
  versioned in git and improves via PR like everything else.

**Preconditions (Mike's setup checklist, §7):** GitHub private repo exists and
`origin` pushes; `gh auth login` completed on the Mac mini; launchd + n8n configured
per the plan's templates.

## 2. Components

```
tools/freshness/
├── watchlist.json        # generated: every sourceUrl across all datasets + the four
│                         #   network price-guide URLs, with per-URL transport hints
│                         #   and watchable flags (WAF-hard pages: watchable=false)
├── hashes.json           # watchdog state: normalised-content hash per watched URL
├── generate-watchlist.ts # derives watchlist.json from the datasets (tested)
├── watchdog.md           # n8n workflow description + import JSON
└── run-agent.sh          # thin runner: claude -p "/freshness <args>" with caps

.claude/skills/freshness/SKILL.md   # the agent's playbook (modes: check, sweep)
docs/launchd/com.mathfamily.freshness-sweep.plist  # weekly schedule template
```

**Data flow:** watchdog fetches each watchable URL daily (curl → r.jina fallback per
the transport hints), normalises text (strip whitespace, dates, cookie banners),
hashes, diffs against `hashes.json`. On change: triggers `run-agent.sh check
<changed-slugs>` and marks the URL `pendingSince: <date>` in `hashes.json` so a
change triggers exactly one run — the marker clears when the agent verifies the page
and stores its new hash (i.e. when the PR lands). Weekly (launchd): `run-agent.sh sweep`. The agent verifies, edits
data/notes, runs the full gate, pushes branch `freshness/YYYY-MM-DD[-slug]`, opens a
PR with a diff table (old → new → source URL) and any flagged items. Mike merges;
Vercel deploys from main.

## 3. The /freshness skill (playbook contract)

**Mode `check <slugs-or-urls>`:** re-verify only the named records against their
official sources using the established transport ladder (WebSearch site-scoped →
WebFetch → r.jina.ai → Wayback → official PDFs). Update values + `verifiedAt` (+
`snapshotDate` for quote-type data), bump dataset version (patch), append to the
relevant `docs/verification/*-research-notes.md`, regenerate `watchlist.json` if
sourceUrls changed, update `hashes.json` for the verified pages.

**Mode `sweep`:** everything `check` does, scoped to: (a) all records within 14 days
of the 60-day freshness warning; (b) ALL eSIM bundles (re-quote, new snapshotDate);
(c) one retry of the hard-blocked standing targets (London City drop-off page,
Newcastle parking prices); (d) a staleness report table in the PR body.
`sweep --full` (January ritual): every record in every dataset.

**Honesty rules (inherited from P1–P3, restated in the skill):** official sources
only; never invent or extrapolate beyond officially published per-day/per-unit rates
(arithmetic on official rates must be noted); unverifiable → null/exclude + flag,
never guess; conversions carry "(converted)" + rate; every change traces to a source
URL in the PR body.

## 4. Bounded code-change rules

The agent MAY edit, following repo TDD conventions:
- dataset JSON files, research notes, `watchlist.json`/`hashes.json`
- additive dataset schema modules (`packages/data/src/{roaming,esim,baggage,parking,lounges}.ts`)
  and their tests, when a published structure genuinely changes
- app content helpers (`apps/*/lib/*-content.ts`) and their tests, when rendering
  rules must follow a structure change

The agent MUST NOT edit: shared engine/ui/geo source, `partners.json` (especially
`active` flags), page/route files, configs, or workflows. When a needed change falls
outside its bounds, it writes a **NEEDS-HUMAN** section in the PR describing exactly
what and why, instead of doing it.

Every run: fresh branch from main; full gate (`pnpm test && pnpm typecheck &&
pnpm build`) must pass before `gh pr create`; never push main; one PR per run.

## 5. Failure handling

- Unverifiable value → flagged item in the PR (Newcastle precedent), no guess.
- Gate fails after changes → commit nothing to the PR branch; open a GitHub issue
  with the failure output instead.
- Watchdog fetch errors (not content changes) → n8n notifies Mike directly; no agent run.
- Token guardrails: `run-agent.sh` passes `--max-turns` caps; the watchdog batches
  all same-day changes into a single `check` run; sweep runs are weekly only.
- Two consecutive failed sweeps → n8n alert (the system must not fail silently).

## 6. Testing

- `generate-watchlist.ts`: unit-tested; a coverage test asserts every dataset
  sourceUrl appears exactly once (keeps watchlist in sync with data forever).
- `run-agent.sh --no-pr` dry-run mode: verifies + edits + gate locally without
  pushing — used for the first supervised run and any debugging.
- Watchdog normaliser: unit-tested against fixture HTML (cookie banners, dates
  stripped; real tariff change detected).
- First live run is supervised: Mike watches the agent produce its first PR before
  launchd/n8n take over.

## 7. Setup checklist (human, one-time)

1. Create the GitHub private repo (`MikeWebDeveloper/MathFamily`) and push main + tags.
2. `gh auth login` on the Mac mini (agent needs it for `gh pr create`).
3. Install the launchd plist (weekly sweep, Sunday 07:00).
4. Import the n8n watchdog workflow; set its error-notification channel.
5. Supervised first run: `tools/freshness/run-agent.sh sweep --no-pr`, then a real one.

## 8. Out of scope for P4

Auto-merge of any kind; content/marketing generation; new spokes or sites; touching
affiliate activation; the SkyParkSecure live API (later phase); replacing the
watchdog's deterministic diffing with local-model judgment (Gemma/Hermes can be added
inside n8n later for noise filtering, but the v1 normaliser is deterministic).

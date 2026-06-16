---
name: watchdog
description: Daily ParkMath site + affiliate-deeplink health check. Runs tools/watchdog/check.mjs; on failure opens/updates a single rolling GitHub issue using the report the runner writes; silent when everything is green. Use when asked to run the site watchdog.
---

# watchdog routine

Runs the read-only `tools/watchdog` checker and turns a failure into one actionable, rolling
GitHub issue. **Silent when green** — no issue, no noise.

## Hard rules
- **Read-only.** The only side effects are: a GitHub issue (via `gh`) and the runner's own
  `docs/reports/watchdog-<YYYY-MM-DD>.md` (written by `check.mjs` on failure). Never edit code,
  datasets, or `partners.json`.
- **Never fire affiliate trackers.** `check.mjs` already guarantees this; never add a request to
  `awin1.com`. "Test the affiliate link" means the merchant **destination** page only.
- **One rolling issue.** Reuse a single open issue labelled `watchdog`; never open a second. Comment
  to update; close when green.
- **Guard the volume.** The repo is on the external TB4 volume. If the repo path is not present,
  report "repo volume not mounted" and stop cleanly — do not flag a false outage.

## Steps
1. **Preflight.** Confirm the repo root exists (the `package.json` with `"name": "mathfamily"`). If
   not, stop cleanly.
2. **Run the check** from the repo root:
   ```bash
   node tools/watchdog/check.mjs --json
   ```
   Capture stdout (JSON: `{ ok, failures, checked, reportPath }`) and the exit code.
3. **If exit 0 (green):**
   - If an open issue with label `watchdog` exists
     (`gh issue list --label watchdog --state open --json number,title`), comment
     `✅ Green again as of <YYYY-MM-DD>.` and close it.
   - Otherwise do nothing. Done.
4. **If exit 1 (failures):**
   - The runner has already written the report at the JSON's `reportPath`
     (`docs/reports/watchdog-<YYYY-MM-DD>.md`). Use that file as the issue body.
   - Find the rolling issue: `gh issue list --label watchdog --state open --json number`.
     - **None open:** ensure the label exists, then create the issue —
       ```bash
       gh label create watchdog --color B60205 --description "site/deeplink watchdog" || true
       gh issue create --label watchdog --title "🔴 Watchdog — affiliate/site failures" --body-file <reportPath>
       ```
     - **One open:** add the current failure list as a comment —
       ```bash
       gh issue comment <number> --body-file <reportPath>
       ```
   - Do not @-mention or escalate beyond the issue.
5. **Report** a one-line summary (green / issue #N created or updated).

## Guardrails recap
- Silent on green; one rolling `watchdog`-labelled issue on failure (body = the runner's report).
- No affiliate-tracker requests, ever. No edits to code/data. Volume-guarded.

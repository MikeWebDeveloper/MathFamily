# Freshness watchdog — setup guide

## What the watchdog does

The watchdog is a daily deterministic check that every official source URL in the
Math family datasets is still returning the same normalised content. It does not
verify prices — that is the agent's job. It detects that something changed so the
agent can go verify.

Full data-flow description: spec §2
(`docs/superpowers/specs/2026-06-10-p4-freshness-agent-design.md#2-components`).

Short version:

- **06:30 daily** — n8n runs `pnpm watchdog` inside `tools/freshness/`.
- Watchdog fetches every `watchable: true` URL from `watchlist.json` (direct fetch
  with a browser UA; on failure or block-page, retries via `https://r.jina.ai/<url>`).
- Content is normalised (HTML stripped, dates removed, cookie-banner boilerplate
  removed) and SHA-256 hashed.
- **Bootstrap run (first time ever):** no stored hash → stores `{hash, checkedAt}`
  silently; no PR triggered.
- **No change:** updates `checkedAt`; nothing else happens.
- **Change detected:** sets `pendingSince` on the entry in `hashes.json` and triggers
  `run-agent.sh check <refs>` to open a verification PR. The single-trigger rule
  applies: subsequent watchdog runs do nothing for a URL that is already `pendingSince`
  — the marker clears only when the agent lands a PR and stores the new hash.
- **Fetch errors** (not content changes): the workflow's "Errors?" branch fires and
  routes to the "Notify Mike (wire me up)" no-op node.
- **Sweep recency check:** the workflow also checks daily whether the launchd-driven
  weekly sweep has written `$HOME/Library/Logs/mathfamily-freshness/last-sweep-success`
  within the past 14 days. If not, the "Sweep stale?" branch fires and routes to the
  same notifier node. Note that `last-success` is a general "any run" beacon written on
  every invocation (check or sweep); `last-sweep-success` is written **only** by sweep
  runs — that is what the 14-day staleness alert watches, so a flurry of daily check
  runs cannot mask a missed weekly sweep.

> **Timeout note (reviewer):** n8n's `executeCommand` node has no default timeout.
> On a pathological all-blocked day (every watchable URL exhausts both the direct and
> r.jina.ai transports before failing) the "Run watchdog" node could run up to
> approximately 2 hours (100 URLs × 45 s timeout × 2 transports). In realistic
> conditions the run finishes in approximately 10 minutes. This is expected behaviour,
> not a hang — do not add a workflow-level timeout that is shorter than 2 hours.

---

## Importing the n8n workflow

1. Open n8n (http://localhost:5678 or your instance URL).
2. Go to **Workflows → Import from file**.
3. Select `tools/freshness/n8n-workflow.json` from this repo.
4. Save and activate the workflow.

After importing, wire up the notifier (see "Adding a notifier" below) before
activating.

---

## Installing the launchd plist (weekly sweep)

The plist fires `run-agent.sh sweep` every Sunday at 07:00.

```zsh
cp "/Volumes/TB4 Workstation/Users/mike/Desktop/Projects/MathFamily/docs/launchd/com.mathfamily.freshness-sweep.plist" \
   ~/Library/LaunchAgents/

launchctl load ~/Library/LaunchAgents/com.mathfamily.freshness-sweep.plist
```

To verify it is loaded:

```zsh
launchctl list | grep mathfamily
```

To unload (e.g. for editing):

```zsh
launchctl unload ~/Library/LaunchAgents/com.mathfamily.freshness-sweep.plist
```

---

## `gh auth login` requirement

The agent calls `gh pr create` to open pull requests. The GitHub CLI must be
authenticated on the Mac mini before any live run:

```zsh
gh auth login
```

Choose HTTPS, authenticate via browser or token. Verify with:

```zsh
gh auth status
```

The agent also needs `git push` access to `origin`. Confirm that the remote is set
and that `gh` is authenticated to the same account that owns the repo.

---

## Log locations

| What | Path |
|------|------|
| Agent run logs (each run) | `~/Library/Logs/mathfamily-freshness/<YYYY-MM-DD_HHMM>.log` |
| General "any run" beacon | `~/Library/Logs/mathfamily-freshness/last-success` |
| Sweep-only recency beacon | `~/Library/Logs/mathfamily-freshness/last-sweep-success` |
| launchd stdout | `/tmp/mathfamily-freshness-sweep.log` |
| launchd stderr | `/tmp/mathfamily-freshness-sweep.err` |

`last-success` is written on every run (check or sweep). `last-sweep-success` is written
only by sweep runs, and is what the n8n "Sweep ran in last 14 days?" node checks — so
the staleness alert cannot be silenced by daily check runs.

To tail a live run:

```zsh
tail -f ~/Library/Logs/mathfamily-freshness/$(ls -t ~/Library/Logs/mathfamily-freshness/*.log | head -1)
```

---

## Supervised first-run procedure

Do this once before letting launchd and n8n run autonomously.

**Step 1 — dry run (no PR):**

```zsh
"/Volumes/TB4 Workstation/Users/mike/Desktop/Projects/MathFamily/tools/freshness/run-agent.sh" sweep --no-pr
```

The agent will:
- Branch `freshness/YYYY-MM-DD` from main
- Verify stale records and eSIM bundles
- Run the full gate (`pnpm test && pnpm typecheck && pnpm build`)
- Leave the branch local (no push, no PR)

Inspect the local branch and diff:

```zsh
git log --oneline freshness/$(date +%Y-%m-%d) | head -20
git diff main...freshness/$(date +%Y-%m-%d)
```

Check that every change has a source URL and makes sense. Review the research notes
appended to `docs/verification/`.

**Step 2 — live run (with PR):**

Once you are happy with the dry-run output:

```zsh
"/Volumes/TB4 Workstation/Users/mike/Desktop/Projects/MathFamily/tools/freshness/run-agent.sh" sweep
```

The agent pushes the branch and opens a PR. Review and merge it on GitHub. From this
point the automated schedules can take over.

---

## Adding a notifier to the n8n no-op node

The "Notify Mike (wire me up)" node is a no-op placeholder. Connect it to whichever
notification method you prefer:

- **Email:** add an n8n Gmail or SMTP node after "Notify Mike (wire me up)".
- **Slack/Telegram/Pushover:** add the relevant n8n node.
- **Webhook:** add an HTTP Request node pointing at any webhook endpoint.

The notifier receives the same JSON as the rest of the workflow. The `errors` array
(from the watchdog output, passed through via the "Parse result" node) contains
`{ url, message }` objects. For the sweep-stale branch, `stdout` will be `"STALE"`.

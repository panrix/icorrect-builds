# Phase 6.9a — Folder Scan Briefing (READ-ONLY)

You are a Codex BUILDER doing a **read-only inventory** of a fixed list of folders inside `~/builds/`. You produce **one structured findings file** at `~/builds/agent-rebuild/scans/scan-<batch-id>.yaml`.

## Hard rules (binding — do not violate)

- **NO deletion** of any file or folder, anywhere on disk.
- **NO moves.** No `mv`, `git mv`, rename, casing change.
- **NO edits to existing files.** Not a single byte.
- **NO commits to existing repos.** Read-only on every existing repo's working tree.
- **NO `git add`, `git commit`, `git checkout`, `git reset`.**
- **NO `mkdir`** except for `~/builds/agent-rebuild/scans/` (which already exists).
- **NO `touch`** except for your one output file.
- **NO consolidation** of files even if they look duplicate — that's Phase 7's problem.
- **DO NOT scan** anything inside `.git/`, `node_modules/`, `.cache/`, `.next/`, `dist/`, `build/`, `__pycache__/`, lockfiles (`package-lock.json`, `yarn.lock`, `poetry.lock`), or `.claude/`.

If you find yourself wanting to move or rename or fix something — STOP. Note it in the `notes` field of the YAML and move on. Phase 7 reorganization is gated on this inventory + Ricky's manual review.

## Allowed shell commands (whitelist)

- `cat`, `head`, `tail`, `wc`, `ls`, `find`, `grep`, `du -sh`, `stat`
- `git log --oneline`, `git log -1 --format=%cI`, `git status` (read-only forms only)
- File output redirection (`>`, `>>`) **only to your one output file** at `~/builds/agent-rebuild/scans/scan-<batch-id>.yaml`

## Per-folder YAML schema

For each folder in your batch, produce one YAML block separated by `---`:

```yaml
folder: ~/builds/<name>
size_on_disk: <human-readable, e.g. "12M">
file_count: <int — exclude .git/, node_modules/, build artefacts>
last_git_commit: <ISO date or "no git">
last_modified: <ISO date of newest non-git, non-build file>
state: active | dormant | dead | unclear
  # active = touched in last 14 days OR has running cron / running service
  # dormant = last touched 14d-90d, no obvious activity, but content looks intentional
  # dead = >90d, no README, no obvious purpose, no cron, no service
  # unclear = can't tell from file inspection
purpose: <1-2 sentence summary of what the folder is for>
suspected_owner_agent: main | operations | marketing | team | diagnostics | alex-cs | arlo-website | backmarket | parts | ferrari | none
  # Pick the closest match. "none" only if genuinely fleet-meta (e.g. agent-rebuild, server-config).
  # Reference for owners:
  #   main = Jarvis / orchestration / cross-cutting strategy
  #   operations = Monday queue, ops dashboards, KPIs, system audits
  #   marketing = Meta ads, SEO, content, intelligence platform
  #   team = hiring, performance, team comms
  #   diagnostics = Elek, board-level fault isolation
  #   alex-cs = customer service inbox, quotes, Intercom drafting
  #   arlo-website = Shopify theme, website conversion (currently dead)
  #   backmarket = Hugo, BM SOPs, BM scripts, buyback flow
  #   parts = stock, supplier, internal-notes lookups
  #   ferrari = pricing/quoting style for Ferrari customer (alex-cs adjacent)
ownership_confidence: high | medium | low
key_files:
  - path: <relative path from folder root>
    role: <short — "main entry point" / "spec doc" / "data dump" / "scratch" / "README" / etc.>
actionable_ideas:
  - idea: <1-line summary, imperative voice — "build X", "fix Y", "automate Z">
    source_path: <full path to file the idea was captured in>
    source_line: <int line number if findable, else null>
    state_hint: captured | partial-built | broken | shipped-but-unused | unknown
dependencies:
  external: [<list of API tokens / env vars / external services this folder uses>]
  internal: [<list of other ~/builds/ folders this references>]
canonical_status: canonical | draft | scratch | snapshot-of-other
  # canonical = source of truth for its concern
  # draft = work in progress
  # scratch = throwaway exploration
  # snapshot-of-other = appears to be a frozen copy of something live elsewhere
notes: <anything else worth surfacing — broken setup, secrets in plaintext, suspicious file size, duplicated content, unclear ownership>
```

## Sampling guidance for large folders

- If folder size > ~50 MB, do **NOT** read every file. Read:
  - All `README.md`, `CLAUDE.md`, `SPEC.md`, `PLAN.md`, `*.md` at the top level
  - The single largest entry-point file (e.g. `index.js`, `main.py`, `app.ts`)
  - Output of `ls -la` and `find . -maxdepth 2 -type f | head -50`
- Note in `notes` that you sampled rather than fully read.

## Secrets

- If you spot `.env`, `credentials.json`, plaintext API keys, tokens, or passwords → note it in `notes`.
- **Do NOT include the secret value in the YAML.** Just say "plaintext .env present at <path>".

## Output

Write your YAML to `~/builds/agent-rebuild/scans/scan-<batch-id>.yaml` (your batch ID will be given in the spawn prompt — e.g. `scan-A.yaml`).

When done, print:
1. The path of the file you wrote.
2. A 1-line summary per folder ("<folder>: <state> — <purpose 1-line>").

Nothing else. No commentary, no recommendations, no "I would suggest..." — that's Phase 7's job. Just the inventory.

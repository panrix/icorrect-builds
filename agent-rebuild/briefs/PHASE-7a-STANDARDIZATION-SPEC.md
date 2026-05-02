# Phase 7a — Folder-Standard Rollout to 49 Folders

**Created:** 2026-05-02
**Owner:** main (planning); execution by Codex BUILDER spawns in fresh Code session
**Status:** spec'd — pending Ricky go-ahead to dispatch
**Gates:** None (proceeds in parallel with Ricky's 6.9e review of folder-inventory tags). Phase 7b (top-level migration) gated on this completing.

---

## Goal

Apply the folder-standard at `briefs/folder-standard.md` to every folder under `~/builds/` except `agent-rebuild/` (already done as proof-of-concept). All 49 folders end with identical canonical structure: `INDEX.md`, `briefs/`, `decisions/`, `docs/`, `archive/`, `scratch/` plus project-specific dirs (`src/`, `scripts/`, `data/`, etc.). Existing files reorganized into the right subfolders. Path references INTO these folders patched fleet-wide.

## Why Option A (rigid uniform structure, not state-scaled)

Decided 2026-05-02. Even tiny dormant folders get full subfolder skeleton (mostly empty). Reasons:

- **Consistency**: every folder has the same shape; agents and humans don't have to learn per-folder layouts
- **Auditability**: QA can verify by template — "does this folder have the 5 standard subdirs + INDEX.md?" — instead of judging "is this depth right for this state?"
- **Future-proof**: dormant today might be active tomorrow; lighter treatment now means redoing later
- **Avoids judgment-tax**: spawns don't have to decide depth-per-folder (which itself adds inconsistency)

The cost (empty subfolders in some folders) is real but small. Worth the consistency.

---

## Hard rules (binding for the entire phase)

1. **Read-only inspection FIRST, moves SECOND.** Each spawn reads + classifies all files before any `mv`. No staged moves.
2. **No deletions.** Anything that doesn't fit a category goes to `scratch/` (with a note in INDEX), not `rm`.
3. **No commits.** All moves stage in working tree only. Ricky commits when ready.
4. **No editing of existing file content.** Only moves + new files (INDEX.md, sub-INDEX.md). Don't rewrite README content, don't add notes inside existing files.
5. **No restructuring of code dirs.** `src/`, `scripts/`, `lib/` etc. retain their internal structure. The standardization is about TOP-LEVEL files in each folder, not deep refactoring.
6. **Excluded from classification:** `node_modules/`, `.git/`, `.cache/`, `dist/`, `build/`, `.next/`, `__pycache__/`, `*.lock`, `package-lock.json`, `yarn.lock`, `poetry.lock`, `*.pyc`. Leave these in place; do not move; do not classify.
7. **Path-reference sweep is mandatory.** Each spawn outputs the list of inbound references to its folder (from agent files, KB, openclaw.json, cron jobs, systemd unit files). Consolidation pass uses this for the fleet-wide patch.
8. **The folder-standard at `~/builds/agent-rebuild/briefs/folder-standard.md` is the binding spec.** All structure rules come from there.

---

## Scope

49 folders. The list (from `folder-inventory.md`, with `agent-rebuild/` excluded):

```
alex-triage-classifier-rebuild     icorrect-shopify-theme       quote-wizard
alex-triage-rebuild                intake-notifications          repair-analysis
apple-ssr                          intake-system                 research
backmarket                         intercom-agent                royal-mail-automation
backmarket-browser                 intercom-config               scripts
backmarket-seller-support          inventory-system              server-config
bm-scripts                         llm-summary-endpoint          shift-bot
buyback-monitor                    marketing-intelligence        system-audit-2026-03-31
claude-project-export              mobilesentrix                 team-audits
customer-service                   monday                        telephone-inbound
data                               mutagen-guide                 templates
data-architecture                  operations-system             voice-note-pipeline
documentation                      pricing-sync                  voice-notes
elek-board-viewer                  qa-system                     webhook-migration
hiring                                                            website-conversion
icloud-checker                                                    whisper-api
icorrect-parts-service                                            xero-invoice-automation
                                                                  xero-invoice-notifications
```

---

## Per-folder classification rubric

The spawn reads files at the folder root (level 1, no recursion into excluded dirs) and classifies each. Decision tree:

| Pattern | Destination |
|---|---|
| `INDEX.md` already exists | Keep at root; will be replaced by new INDEX.md |
| `README.md` | Keep at root (operational entry for code projects) |
| `.env`, `.env.*`, `.gitignore`, `.dockerignore`, `Dockerfile`, `docker-compose.yml` | Keep at root |
| `package.json`, `package-lock.json`, `pyproject.toml`, `requirements*.txt`, `Cargo.toml`, `go.mod` | Keep at root (manifest files) |
| `*.md` named `BRIEF-*`, `PHASE-*-SPEC`, `*-proposal`, `*-plan`, `*-spec`, `SPEC-*` | → `briefs/` |
| `*.md` named `*-audit`, `*-analysis`, `*-report`, `*-deep-dive`, `*-investigation` | → `docs/audits/` |
| `*.md` named `*-decision`, `decision-*`, `DECISION-*` | → `decisions/` |
| `*.md` named `*-runbook`, `*-runbook.md`, `RUNBOOK*`, `*-procedure`, `HOW-TO-*`, `*-guide`, `SETUP*`, `INSTALL*` | → `docs/` |
| `*.md` named `*-schema`, `SCHEMA*`, `*-reference`, `*-api`, `API-*` | → `docs/` |
| `*.md` named `*-snapshot`, `*-dump`, `*.snapshot.*`, `*-frozen-*` | → `archive/<existing-date-or-today>-snapshot/` |
| `*.md` named `*-old`, `*-deprecated`, `*-v1`, `*-superseded`, `OLD-*`, `DEPRECATED-*` | → `archive/<today>-superseded/` |
| `*.md` named `WIP-*`, `tmp_*`, `*-scratch`, `notes-*`, `working-*`, `draft-*` (and not promoted) | → `scratch/` |
| `*.md` first 50 lines contain "proposal", "spec", "draft", "should we", "what if" prominently | → `briefs/` (if not matched above) |
| `*.md` not matched above, content looks canonical (how-it-works, schema, runbook tone) | → `docs/` |
| `*.md` not matched above, content looks like working notes | → `scratch/` |
| `*.json`, `*.yaml`, `*.yml` (config or data) | If in a `data/` or `config/` subdir, leave; if at root and looks like runtime data, → `data/`; if looks like config, → `docs/` (with note) |
| `*.py`, `*.js`, `*.ts`, `*.sh`, `*.rb`, `*.go` (code) | If small (<3 files at root), → `scripts/`; if part of a larger code base, leave at root |
| `*.csv`, `*.tsv`, `*.db`, `*.sqlite`, `*.log` | → `data/` (with `.gitignore` entry if not already) |
| `*.png`, `*.jpg`, `*.svg`, `*.pdf` (assets) | → `docs/assets/` (create if needed) |
| Subdirs (not excluded) | Leave alone (only restructure top level) |

Edge cases:
- **Truly ambiguous file**: place in `scratch/` and note in INDEX.md "pending classification — needs human review"
- **Rename conflict** (e.g. moving creates two files with same name): rename the second with a `-2` suffix and note in INDEX.md
- **Symlinks**: leave in place; note in INDEX.md

---

## INDEX.md template — varies by state

State comes from the inventory's `state` tag (active / dormant / dead / unclear). Spawn reads `~/builds/agent-rebuild/folder-inventory.md` to get the state tag for its folder before writing INDEX.md.

### Active folders (28 of 49)

```markdown
# <project-name>

**State:** active
**Owner:** <agent-id from inventory>
**Purpose:** <1-2 sentence — pull from inventory's "purpose" column>
**Last updated:** <YYYY-MM-DD HH:MM TZ>

## Current state

### In flight
- <If folder has visible WIP — pull from any status.md, current README, or recent commits. If unclear, write "no live state captured — needs population by owner agent">

### Recently shipped
- <If git log shows recent commits, summarize. Else "n/a">

### Next up
- <If briefs/ has unshipped specs, list them. Else "n/a">

## Structure

- `briefs/` — <one-line summary of what's in flight, OR "empty — no proposals yet">
- `decisions/` — <one-line summary, OR "empty — backfill in Phase 7c if useful">
- `docs/` — <one-line summary, OR "empty">
- `archive/` — <one-line summary, OR "empty">
- `scratch/` — <one-line summary, OR "empty">
- (project-specific subdirs as relevant)

## Key documents

- [list moved files with 1-line description each, organized by destination subfolder]

## Open questions

- <If any flagged in inventory's "actionable_ideas" column, surface as bullets. Else omit section.>
```

### Dormant folders (21 of 49)

```markdown
# <project-name>

**State:** dormant (last activity: <date from git log or file mtime>)
**Owner:** <agent-id from inventory>
**Purpose:** <pull from inventory>
**Last updated:** <YYYY-MM-DD HH:MM TZ>

## Current state

Dormant. Last meaningful change: <date>. Reason for dormancy: <if known from inventory; else "unknown — needs review">

**Phase 7c review candidate:** assess whether to revive, archive, or merge into related domain.

## Structure

[same as active, but most subfolders likely empty]

## Key documents

[list moved files with 1-line description each]
```

### Dead folders (1 of 49 — `voice-notes/` per inventory)

```markdown
# <project-name>

**State:** dead — candidate for Phase 7c archive
**Owner:** <agent-id from inventory, often "main" or "none">
**Last activity:** <date>
**Last updated:** <YYYY-MM-DD HH:MM TZ>

## Current state

This folder is classified dead in the 6.9 inventory. No recent activity, no obvious purpose, no live referencing service.

**Recommendation for Phase 7c:** archive whole folder to `~/archive/2026-MM-DD-dead-on-arrival/`.

## Structure

Standard subfolders created for consistency only — not actively used.

## Key documents

[list any files; usually short]
```

### Unclear folders (0 of 49 currently, but include for completeness)

```markdown
# <project-name>

**State:** unclear — needs Ricky review
**Owner:** <agent-id from inventory, may be "none">
**Purpose:** <best guess from contents>
**Last updated:** <YYYY-MM-DD HH:MM TZ>

## Current state

Folder purpose / state could not be determined from contents alone. Needs human review to decide active / dormant / dead and whether to keep / promote / archive.

## Structure

[standard]
```

---

## Sub-INDEX rules

Per the folder-standard:

- **`briefs/INDEX.md`** REQUIRED if briefs/ has > 5 files
- **`docs/INDEX.md`** REQUIRED if docs/ has > 5 files
- **Sub-folder INDEX.md** when a subdir nests deeply (e.g. `docs/audits/INDEX.md` if audits/ > 5 files)

Spawn checks file count after moves and creates sub-INDEXes as needed. INDEX content lists each file with a 1-line description.

---

## Spawn dispatch

8-10 Codex BUILDER spawns in parallel. Each handles a 5-7 folder batch.

### Per-spawn briefing template

```
You are Phase 7a of the iCorrect agent rebuild. Apply the folder-standard at
~/builds/agent-rebuild/briefs/folder-standard.md to the following batch of
folders. READ the standard fully before doing anything.

Batch: [insert 5-7 folder paths]

For EACH folder in your batch:
1. Read every file at the folder root (level 1; ignore excluded dirs per spec)
2. Classify each file per the rubric in PHASE-7a-STANDARDIZATION-SPEC.md
3. Read the folder's state from ~/builds/agent-rebuild/folder-inventory.md
4. Read the folder's owner from the inventory
5. Move files into briefs/, decisions/, docs/, docs/audits/, archive/, scratch/
   (mkdir as needed; create empty subdirs even if no files land there)
6. Write INDEX.md per the appropriate template (active/dormant/dead/unclear)
7. Create sub-INDEX.md where required (briefs > 5 files, docs > 5 files,
   any sub-folder > 5 files)
8. Sweep for inbound path references — grep across:
   - ~/.openclaw/agents/*/workspace/*.md (top-level only, not memory/)
   - ~/.openclaw/shared/*.md
   - ~/.openclaw/openclaw.json
   - ~/CLAUDE.md
   - ~/claude-audit-rebuild/*.md
   - ~/kb/**/*.md
   - ~/builds/agent-rebuild/idea-inventory.md
   - ~/builds/agent-rebuild/folder-inventory.md
   - cron jobs (crontab -l) and systemd user units
9. Output a structured report per folder

Output: ~/builds/agent-rebuild/scans/phase-7a/scan-<batch-id>.yaml

Report shape per folder:
folder: <path>
state_at_scan: <active|dormant|dead|unclear>
owner: <agent-id>
existing_subdirs_kept: [src, data, scripts, ...]
new_subdirs_created: [briefs, decisions, docs, docs/audits, archive, scratch]
file_moves:
  - from: <old absolute path>
    to: <new absolute path>
    rationale: <which rule from the rubric>
new_files_created:
  - <path>: <description>
sub_indexes_created: [briefs/INDEX.md, docs/INDEX.md, ...]
inbound_references:
  - <referencing file path:line>: <referenced path>
warnings:
  - <anything that needed judgment, was ambiguous, or worth flagging>
status: success | partial | failed

HARD RULES (binding):
- READ-ONLY scan first, then apply moves. No staged or interleaved moves.
- No deletions of any file.
- No commits.
- No editing of existing file content.
- No restructuring of src/, scripts/, lib/ — only top-level.
- Excluded dirs: node_modules, .git, .cache, dist, build, .next, __pycache__,
  lock files, *.pyc.
- If anything looks weird, log a warning and continue. Do not block.

When done, print "PHASE-7a SCAN COMPLETE: batch <id>, <N> folders processed,
<M> warnings" and the path of your output file.
```

---

## Consolidation pass (after all 8-10 spawns return)

One Codex BUILDER spawn:

1. Reads all 8-10 batch reports
2. Aggregates `inbound_references` across all 49 folders
3. Builds a single fleet-wide path-patch script (sed pass)
4. Applies the patch, with a dry-run preview first
5. Verifies: every claimed file move actually happened; every new INDEX exists; sub-INDEXes exist where required; the path-patch left nothing broken
6. Updates `~/builds/agent-rebuild/folder-inventory.md` and `~/builds/agent-rebuild/idea-inventory.md` with new paths (sed pass)
7. Outputs `~/builds/agent-rebuild/PHASE-7a-CONSOLIDATION-REPORT.md`:
   - Total files moved
   - Total new INDEX/sub-INDEX files created
   - Total path references patched
   - Any warnings escalated from spawn reports
   - Any references that couldn't be resolved (orphaned)

---

## QA pass (after consolidation)

Independent general-purpose subagent (or Codex if sandbox cooperates):

1. Reads PHASE-7a-CONSOLIDATION-REPORT.md
2. For 8-12 randomly chosen folders, verifies:
   - INDEX.md exists at root
   - 5 standard subdirs exist (briefs, decisions, docs, archive, scratch)
   - No clearly-uncategorized files left at root (excluding allowed ones)
   - Sub-INDEXes exist where the >5-files rule fires
   - File moves match the report
3. Spot-checks 15-20 patched references
4. Sweeps for new broken references caused by the patch
5. Outputs `~/builds/agent-rebuild/QA-PHASE-7a-report.md` with FAIL/WARNING/PASS findings

---

## Acceptance

- All 49 folders have INDEX.md at root
- All 49 have the 5 standard subdirs
- All 49 have appropriate sub-INDEXes per the >5-files rule
- All inbound references patched (no broken refs that weren't already broken pre-Phase-7a)
- folder-inventory.md and idea-inventory.md updated with new paths
- QA report has 0 FAIL findings (warnings acceptable, fixed if quick)
- Ricky has been handed back the standardized fleet for review

---

## What this does NOT do

- Top-level migration (Phase 7b — comes after)
- Deletion of dead folders (Phase 7c — comes after)
- Secrets rotation (Phase 6.95 folded into Phase 7c)
- Restructuring of code inside `src/`/`scripts/`/`lib/`
- Restructuring of agent workspaces (different concern, different standard)
- KB restructuring (`~/kb/` has its own organization)

---

## Realistic clock time

- Spawns dispatch + parallel run: 60-90 min (49 folders × 5-7 per spawn × actual classification work is heavier than 6.9 scan)
- Consolidation pass: 30-45 min (aggregating + applying fleet-wide patch is not trivial at 49-folder scale)
- QA pass: 30-45 min
- **Total fresh-session time: ~2.5-3 hours focused work**
- Plus Ricky review: hours, spread

---

## Risk and rollback

- **Risk:** path-patch hits a reference inside a file we don't expect (e.g. inside a code comment, inside a markdown table). Sed pass might mangle it.
  - **Mitigation:** dry-run preview before applying. Patch-script is grep-able. Restricted to files matching specific patterns (\*.md, \*.json, \*.toml — not \*.py code by default).
- **Risk:** spawn classifies a critical file wrong (e.g. moves a runtime config file to scratch/).
  - **Mitigation:** runtime data and config patterns explicitly named in the rubric. Warnings surface ambiguous cases. QA pass catches mistakes.
- **Risk:** large folders (`backmarket-browser` 1.3G, others) take spawn too long or hit context limits.
  - **Mitigation:** spawn only classifies top-level files; ignores deep code dirs. node_modules / .git excluded.
- **Risk:** committing too early loses rollback ability.
  - **Mitigation:** No commits during the phase. Working tree only. Ricky commits after sign-off.
- **Rollback:** if catastrophe, `git restore .` reverts the working tree (some new files would persist as untracked). For staged-but-uncommitted work, `git checkout HEAD -- <path>` per folder.

---

## Open questions

1. **Should this run NOW (interleaved with Ricky's 6.9e review) or AFTER 6.9e signoff?** Honest answer: NOW is fine. 6.9e is reviewing folder-level tags (state, owner) which don't change under Phase 7a. Path references in idea-inventory.md DO change but that's a positive (paths point at standardized locations afterward). Recommend dispatching Phase 7a now, in parallel with 6.9e.
2. **Should the dispatch happen in this session or a fresh Code session?** Fresh session, same as Phase 6.9. Multi-spawn orchestration deserves clean attention. Plus this session is already long.
3. **Any folders Ricky wants explicitly excluded** (e.g. don't touch `backmarket/` because something live runs against specific paths)? Default: process all 49. Override list welcome before dispatch.

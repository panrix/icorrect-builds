# Phase 6.9 — Idea & Folder Inventory (Pre-Cleanup Mapping Pass)

**Created:** 2026-05-01
**Goal:** Build canonical inventories of every folder in `~/builds/` (and key agent-workspace + KB locations) before any cleanup phase runs. Capture every actionable idea with a source-doc breadcrumb. Tag each folder with its owning agent.

**Non-goals (read these twice):**
- **NO deletion.** Not a single file or folder.
- **NO moves.** No `mv`, no `git mv`, no rename.
- **NO renames.** Including casing changes.
- **NO commits to existing repos.** Read-only on every existing repo's working tree.
- **NO edits to existing files.** All new content goes to new files (paths listed below).
- **NO consolidation.** Don't merge files even if they look duplicate.
- **NO opinion on what to delete later.** That's Phase 7's problem, with this inventory as guard.

If a Codex BUILDER spawn proposes any of the above during the work, **stop the spawn and report**. Phase 7 is gated on Phase 6.9 + Ricky's manual review.

---

## Why this exists

Ricky has captured strategic ideas across ~50 folders in `~/builds/`, plus per-agent workspace docs and memory files. A cleanup pass without an inventory loses the breadcrumb between "idea X" and "the doc that originally captured it." That's the failure mode Ricky explicitly named: idea-rot via tidying.

The inventory turns Phase 7 cleanup from "is this file important?" (impossible) to "is this idea on the list?" (single lookup).

---

## Inputs

### Primary scan roots
1. **`~/builds/`** — 50 folders (enumerated in §Folder Manifest below; recount on session start in case anything changed)
2. **`~/.openclaw/agents/*/workspace/docs/`** — per-agent strategy docs
3. **`~/.openclaw/agents/*/workspace/memory/`** — daily memory files where ideas surface
4. **`~/kb/`** — canonical knowledge base

### Excluded (do not scan)
- Anything under `.git/` directories
- `node_modules/`
- `.cache/`, `.next/`, `dist/`, `build/`, `__pycache__/` build artefacts
- Lockfiles (`package-lock.json`, `yarn.lock`, `poetry.lock`)
- Anything under `.claude/` (gstack runtime artefacts; not idea source)
- The agent-rebuild's own `scans/` output dir (this phase's working area)

---

## Folder Manifest (~/builds/ as of 2026-05-01)

50 folders to scan. Recount on session start.

```
agent-rebuild                         alex-triage-classifier-rebuild
alex-triage-rebuild                   apple-ssr
backmarket                            backmarket-browser
backmarket-seller-support             bm-scripts
buyback-monitor                       claude-project-export
customer-service                      data
data-architecture                     documentation
elek-board-viewer                     hiring
icloud-checker                        icorrect-parts-service
icorrect-shopify-theme                intake-notifications
intake-system                         intercom-agent
intercom-config                       inventory-system
llm-summary-endpoint                  marketing-intelligence
mobilesentrix                         monday
mutagen-guide                         operations-system
pricing-sync                          qa-system
quote-wizard                          repair-analysis
research                              royal-mail-automation
scripts                               server-config
shift-bot                             system-audit-2026-03-31
team-audits                           telephone-inbound
templates                             voice-note-pipeline
voice-notes                           webhook-migration
website-conversion                    whisper-api
xero-invoice-automation               xero-invoice-notifications
```

---

## Sub-phases

### 6.9a — Parallel folder scan

**8-10 Codex BUILDER spawns** running in parallel. Each spawn handles a **batch of 5-7 folders** from the Folder Manifest. Same template per folder, different folder set per spawn.

**Spawn dispatch shape (use ACP):**
```
runtime: "acp"
agentId: "codex"  (or whichever Codex agent ID is canonical post-rebuild)
prompt: see "Spawn briefing" below, with the batch list inserted
```

**Spawn briefing (pasted into each spawn's prompt):**

> You are doing READ-ONLY analysis of a fixed list of folders. You produce one structured findings file. You do NOT edit, move, rename, delete, commit, or modify anything in those folders. Output goes to a NEW file under `~/builds/agent-rebuild/scans/`.
>
> **Folders to scan in this batch:** [insert 5-7 folder paths]
>
> **For each folder, produce a YAML block with these fields:**
> ```yaml
> folder: ~/builds/<name>
> size_on_disk: <human-readable>
> file_count: <int>
> last_git_commit: <ISO date or "no git">
> last_modified: <ISO date of newest non-git file>
> state: active | dormant | dead | unclear
>   # active = touched in last 14 days OR has running cron
>   # dormant = last touched 14d-90d, no obvious activity, but content looks intentional
>   # dead = >90d, no README, no obvious purpose, no cron / no service
>   # unclear = can't tell from file inspection
> purpose: <1-2 sentence summary of what the folder is for>
> suspected_owner_agent: main | operations | marketing | team | diagnostics | alex-cs | arlo-website | backmarket | parts | ferrari | none
>   # Pick the closest match. "none" only if genuinely fleet-meta (e.g. agent-rebuild itself, server-config)
> ownership_confidence: high | medium | low
> key_files:
>   - path: <file path>
>     role: <what it is - e.g. "main entry point", "spec doc", "data dump", "scratch">
> actionable_ideas:
>   - idea: <1-line summary>
>     source_path: <file the idea was captured in>
>     source_line: <line number if findable>
>     state_hint: <captured | partial-built | broken | shipped-but-unused | unknown>
> dependencies:
>   external: <list of API tokens / env vars / external services>
>   internal: <list of other folders this references>
> canonical_status: canonical | draft | scratch | snapshot-of-other
>   # canonical = this is the source of truth for its concern
>   # draft = work in progress
>   # scratch = throwaway exploration
>   # snapshot-of-other = appears to be a frozen copy of something live elsewhere
> notes: <anything else worth surfacing — broken setup, secrets in clear, suspicious file size, etc.>
> ```
>
> **Read-only constraints (binding):**
> - You may run `cat`, `head`, `tail`, `wc`, `ls`, `find`, `grep`, `git log --oneline`, `du -sh`. That's it for shell.
> - You may NOT run `mv`, `cp`, `rm`, `git add`, `git commit`, `git mv`, `chmod`, `chown`, `mkdir` (except in your own output dir), `touch` (except in your own output dir), or any editor that writes to existing files.
> - If a folder is bigger than ~50 MB, do not read every file — sample by directory listing + READMEs + entry-point files only.
> - If a folder has secrets visible in plaintext (`.env`, `credentials.json`), note it in `notes` — do NOT include the secret value.
>
> **Output:** one file at `~/builds/agent-rebuild/scans/scan-<batch-id>.yaml` containing one YAML block per folder in your batch, separated by `---`.
>
> **When done:** print the path of the file you wrote, and a 1-line summary per folder. Nothing else.

**Acceptance for 6.9a:**
- 8-10 scan files exist in `~/builds/agent-rebuild/scans/`
- Every folder in the manifest is covered exactly once
- No file outside `scans/` was created or modified
- No git history changed in any existing repo

### 6.9b — Consolidation

**One Codex BUILDER spawn** reads:
- All scan files from 6.9a
- The existing `~/builds/agent-rebuild/automation-blueprint.md`
- The existing `~/builds/INDEX.md` if present
- The existing `~/builds/EXECUTIVE-BUILD-PLAN.md` if present

Produces two canonical files:

**1. `~/builds/agent-rebuild/folder-inventory.md`** — one row per folder, columns:
| folder | size | state | suspected_owner | ownership_confidence | canonical_status | last_modified | purpose (1-line) |

**2. `~/builds/agent-rebuild/idea-inventory.md`** — one row per actionable idea, columns:
| id (uuid) | idea (1-line) | source_path | source_line | state_hint | suggested_owner | suggested_priority | first_seen_date | notes |

**Dedup rule:** ideas appearing in multiple sources collapse to one row, with all source paths listed in the source_path column.

**Acceptance for 6.9b:**
- Both files exist
- folder-inventory.md has exactly 50 rows (matching the scan count)
- idea-inventory.md has every idea from automation-blueprint.md preserved + new ones surfaced
- Cross-references back to source paths are valid (i.e. paths exist on disk)

### 6.9c — Agent-ownership second pass

**One Codex BUILDER spawn** does a per-agent slice:
- Reads folder-inventory.md
- For each fleet agent (main, operations, marketing, team, diagnostics, alex-cs, arlo-website, backmarket, parts, ferrari), produces an "ownership manifest" listing folders tagged to that agent + a 1-line rationale per folder
- Outputs to `~/builds/agent-rebuild/ownership-manifests/<agent>.md`

Then a **conflict-detection pass:**
- Folders with `suspected_owner_agent: none` → flagged as orphans
- Folders where two agents have plausible claim → flagged as conflicts
- Outputs `~/builds/agent-rebuild/ownership-orphans-and-conflicts.md`

**Acceptance for 6.9c:**
- 10 ownership manifests exist (one per fleet agent)
- Orphans + conflicts file exists
- No folder is in two manifests (handled in conflicts file instead)

### 6.9d — QA cross-check

**One Codex QA spawn** does:
- Independent re-scan of 8-12 randomly chosen folders from the manifest. Compare against the scan output. Any discrepancy → log it.
- Spot-check 15-20 ideas from idea-inventory.md against their source files. Confirm the idea text + source line are accurate.
- Sweep three known-rich locations the original scan handled: `~/builds/voice-notes/`, `~/builds/claude-project-export/`, `~/builds/agent-rebuild/`. Look for ideas the BUILDER pass might have missed (single-occurrence mentions in voice transcripts often get dropped).

Outputs `~/builds/agent-rebuild/QA-6.9-report.md` with:
- Discrepancies found
- Missing ideas to backfill into idea-inventory.md
- Mistaken state tags
- Mistaken ownership tags

**Acceptance for 6.9d:**
- QA report exists
- All P1 discrepancies in the report are patched into the inventories before 6.9e

### 6.9e — Ricky's manual review

**Ricky's hands.** Reads folder-inventory.md + idea-inventory.md in chunks (probably 2-3 sittings). Marks:
- Confirmed ownership
- Borderline items needing decision
- State overrides (e.g. "labelled dormant but actually shipped, change to active")
- Priority on captured ideas

Output: same files, with a `ricky_reviewed: true` field on each row Ricky has touched.

**Acceptance for 6.9e:**
- Every folder has `ricky_reviewed: true`
- Every idea has either `ricky_reviewed: true` or `state: parked` (defer review)

### 6.9f — Reorganization unblocked

Only after 6.9e is signed off. Phase 7 hygiene can begin, with both inventories as guard. Anything Phase 7 wants to archive must be referenced from one of the inventories or it stays.

---

## Outputs (paths)

```
~/builds/agent-rebuild/scans/                           ← 6.9a per-batch scan files
~/builds/agent-rebuild/folder-inventory.md              ← 6.9b canonical
~/builds/agent-rebuild/idea-inventory.md                ← 6.9b canonical
~/builds/agent-rebuild/ownership-manifests/*.md         ← 6.9c per-agent
~/builds/agent-rebuild/ownership-orphans-and-conflicts.md  ← 6.9c
~/builds/agent-rebuild/QA-6.9-report.md                 ← 6.9d
```

---

## Honest caveats

- **Scan won't be 100%.** Codex BUILDERs miss subtleties in voice-note transcripts and old conversation exports. The QA pass + Ricky's manual review catches most of it.
- **State tags are approximations.** "Dormant" vs "dead" vs "active" is judgement. Ricky's review is what makes them authoritative.
- **Agent-ownership tags are first-pass guesses.** Some folders cross multiple domains (e.g. `quote-wizard` could be marketing + operations + alex-cs); the first pass picks the closest match, conflicts file surfaces the rest.
- **Ideas mentioned across multiple files might dedup imperfectly.** If two source paths describe the same idea with different wording, the dedup may miss it. Manual review is the safety net.
- **The `automation-blueprint.md` is partially redundant with idea-inventory.md.** After 6.9, automation-blueprint becomes the priority/sequencing artefact; idea-inventory becomes the index. Don't delete the blueprint; cross-reference it.

---

## Estimated clock time

- 6.9a (parallel scans): 30-45 min
- 6.9b (consolidate): 20-30 min
- 6.9c (ownership manifests): 20-30 min
- 6.9d (QA): 30-45 min
- 6.9e (Ricky's review): hours, spread over sittings
- **Wall-clock to "we have the canonical inventory" before Ricky's review:** ~2 hours focused work in the new Code session

---

## Handoff to Phase 7

Phase 7 (hygiene) reads folder-inventory.md + idea-inventory.md as gates:
- An archive proposal that touches a folder not in the inventory → blocked
- An archive proposal that would orphan a referenced source_path → blocked
- A move proposal that breaks an inventory link → blocked
- Bulk operations require a manifest of "what changes for which inventory rows"

This is what makes cleanup safe.

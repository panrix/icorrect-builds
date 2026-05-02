# Phase 7a — Handoff Prompt for new Code session

Paste the block between the markers below into a fresh Code session at `~/builds/`.

---

## Prompt to paste

```
You're picking up Phase 7a of Ricky's iCorrect agent rebuild — the
folder-standard rollout to all 49 build folders (everything in ~/builds/
except agent-rebuild/, which was the proof-of-concept and is already done).

## Read first (in this order, before doing anything)

1. ~/builds/agent-rebuild/briefs/PHASE-7a-STANDARDIZATION-SPEC.md
   — full spec, hard rules, classification rubric, INDEX.md templates
   per state, dispatch shape, consolidation pass, QA pass, acceptance
   criteria. THIS IS THE BIBLE for this work.

2. ~/builds/agent-rebuild/briefs/folder-standard.md
   — the standard being applied. Structure rules, hard rules per the
   standard, INDEX.md content shape.

3. ~/builds/agent-rebuild/folder-inventory.md
   — 50 folder rows with state tags (active/dormant/dead/unclear) and
   suspected_owner_agent. Spawns read this to populate INDEX.md.

4. ~/builds/agent-rebuild/INDEX.md
   — example of what a finished INDEX.md looks like (agent-rebuild itself
   is the proof-of-concept output).

5. ~/builds/agent-rebuild/briefs/top-level-taxonomy.md
   — context: Phase 7b (top-level migration) comes AFTER 7a. Don't
   relocate folders out of ~/builds/ in this phase. Only standardize
   internally.

6. ~/CLAUDE.md
   — Ricky's working preferences and overall project frame.

7. ~/claude-audit-rebuild/.remember/remember.md
   — most recent handoff state.

## Hard rules (binding for the whole session)

- READ-ONLY scan FIRST per folder, THEN apply moves. No interleaving.
- NO deletions. Anything that doesn't fit a category goes to scratch/
  with a note in INDEX.md.
- NO commits. All moves stage in working tree only. Ricky commits when
  ready.
- NO editing of existing file content. Only moves + new files
  (INDEX.md, sub-INDEX.md).
- NO restructuring of code dirs (src/, scripts/, lib/). Only top-level
  files in each folder.
- Excluded from classification: node_modules/, .git/, .cache/, dist/,
  build/, .next/, __pycache__/, *.lock, package-lock.json, yarn.lock,
  poetry.lock, *.pyc.
- Path-reference sweep is mandatory. Each spawn outputs inbound
  references; consolidation pass patches them fleet-wide in one sed
  pass with a dry-run preview first.
- The folder-standard at ~/builds/agent-rebuild/briefs/folder-standard.md
  is the binding spec for INDEX.md and subfolder structure.

## Scope

49 folders. Full list at PHASE-7a-STANDARDIZATION-SPEC.md §"Scope".
Recount on session start in case anything was added since 2026-05-02.

DO NOT touch agent-rebuild/ (already standardized).

## Your job (high-level)

Run the three sub-passes per the spec:

1. **Spawn dispatch (8-10 parallel Codex BUILDERs)** — each handles a
   5-7 folder batch. Each batch produces a YAML report at
   ~/builds/agent-rebuild/scans/phase-7a/scan-<batch-id>.yaml

2. **Consolidation pass (1 spawn)** — aggregates all batch reports,
   builds the fleet-wide path-patch script, applies with dry-run first,
   updates folder-inventory.md and idea-inventory.md with new paths,
   outputs PHASE-7a-CONSOLIDATION-REPORT.md.

3. **QA pass (1 independent spawn — general-purpose subagent
   preferred since Codex hit sandbox issues last time on similar
   tasks)** — verifies acceptance criteria, outputs
   QA-PHASE-7a-report.md.

## Spawn dispatch

This work is the gstack-installed Claude Code's job to orchestrate.
Use Codex BUILDER spawns via ACP for the per-folder classification.

Probe Codex availability at session start:
node "/home/ricky/.claude/plugins/cache/openai-codex/codex/1.0.3/scripts/codex-companion.mjs" setup --json

If permission gate fires, run that probe directly to re-prime, then
retry the spawn.

If Codex hits the bwrap sandbox issue (it did in the previous QA
attempt), fall back to general-purpose subagents for any spawn that
fails.

## When to checkpoint with Ricky

- Before dispatching the 8-10 batches: confirm batch composition.
  Show Ricky which folders are in which batch.
- After all batches return + before consolidation: confirm spawn
  warnings count. If any batch returned more than 5 warnings, ask
  Ricky if he wants to investigate before proceeding.
- After consolidation but BEFORE applying the fleet-wide path patch:
  show Ricky the dry-run preview of the path patch. He approves
  before it executes.
- After QA: hand back the QA report. Ricky reviews before signoff.

## What "done" looks like

- All 49 folders have INDEX.md at root
- All 49 have the 5 standard subdirs (briefs, decisions, docs,
  archive, scratch)
- Sub-INDEXes exist where the >5-files rule fires
- folder-inventory.md and idea-inventory.md have updated paths
- PHASE-7a-CONSOLIDATION-REPORT.md exists at agent-rebuild/ root
- QA-PHASE-7a-report.md exists with 0 FAIL findings
- Working tree shows ~hundreds of file moves + ~250+ new INDEX/sub-INDEX
  files, all uncommitted
- Ricky has been handed back the standardized fleet for review

Then write a fresh handoff at ~/claude-audit-rebuild/.remember/remember.md
summarizing: what was standardized, where reports live, what Ricky
should review first.

## Tone + working preferences (from CLAUDE.md)
- Terse, specific, no sycophancy openers
- Em-dashes are out
- Swearing is fine when it lands
- Ask before destructive ops; this whole phase has zero destructive
  ops by design
- Use TaskCreate to track sub-passes as you go

Begin by:
1. Confirming you've read the spec
2. Recounting the 49 folders to make sure nothing was added
3. Listing the 8-10 batches you intend to dispatch
4. Waiting for Ricky's go-ahead before launching parallel spawns
```

---

## Notes for Ricky on the new session

- **Where to paste:** spawn a fresh `claude` session at `~/builds/`. Paste the entire block between the markers.
- **First message you'll get:** confirmation of read-through plus a proposed batch list. Verify it covers all 49 folders, then say "go".
- **Three checkpoints during the run:** batch composition; warnings count after batches return; path-patch dry-run before fleet-wide apply. Each is your call.
- **Real work for you:** approving the path-patch dry-run is the highest-stakes one. The patch updates many files; bad regex in the patch could mangle prose. Look at the dry-run before it fires.
- **You can do 6.9e review in parallel** — Phase 7a runs without touching folder-inventory.md tags (which is what 6.9e is reviewing). Path columns in idea-inventory.md will update during 7a, but those are improvements (paths point at standardized locations afterward).
- **If something looks wrong mid-session:** the new Code session should stop and report. Hard rules are binding; if any spawn proposes a deletion or commit, it's broken the contract.

## What this session leaves behind for the new one

- `PHASE-7a-STANDARDIZATION-SPEC.md` (the bible)
- `PHASE-7a-HANDOFF-PROMPT.md` (this file)
- `briefs/folder-standard.md` (the standard being applied)
- `briefs/top-level-taxonomy.md` (Phase 7b context — what comes next)
- `folder-inventory.md` + `idea-inventory.md` (existing 6.9 outputs — input)
- `INDEX.md` at agent-rebuild root (proof-of-concept reference)

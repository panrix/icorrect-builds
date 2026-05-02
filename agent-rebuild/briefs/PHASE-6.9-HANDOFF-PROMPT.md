# Phase 6.9 — Handoff Prompt for new Code session

Paste everything below into a fresh Code session at `~/builds/agent-rebuild/`. The prompt assumes the session has full repo + filesystem access.

---

## Prompt to paste

```
You're picking up Phase 6.9 of Ricky's iCorrect agent rebuild — the **Idea & Folder Inventory pass** that has to run BEFORE any cleanup phase.

## Read first (in this order, before doing anything)
1. `~/builds/agent-rebuild/PHASE-6.9-SPEC.md` — full spec, non-goals, sub-phase breakdown, per-folder scan template, acceptance per phase. THIS IS THE BIBLE for this work.
2. `~/builds/agent-rebuild/system-rethink.md` — context on why this exists (the "idea-rot failure mode")
3. `~/builds/agent-rebuild/automation-blueprint.md` — existing partial inventory (~58 scripts/services); idea-inventory will absorb + extend this
4. `~/builds/INDEX.md` — top-level builds index
5. `/home/ricky/CLAUDE.md` — Ricky's working preferences and overall project frame
6. `~/claude-audit-rebuild/.remember/remember.md` — most recent handoff state

## Hard rules (binding for the whole session)
- **NO deletion** of any file or folder anywhere
- **NO moves** (`mv`, `git mv`, rename)
- **NO renames** (including casing)
- **NO commits to existing repos**
- **NO edits to existing files** — all new content goes to NEW files at the paths the spec lists
- **NO consolidation** of files even if they look duplicate
- The phase is read-only inventory + new-file creation. Reorganization is Phase 7's problem, gated on this inventory + Ricky's manual review.

If a Codex BUILDER spawn proposes any of the above during the work, STOP that spawn and report it.

## Scope reminder
- 50 folders in `~/builds/` to map (the spec has the manifest)
- Plus `~/.openclaw/agents/*/workspace/docs/` and `~/.openclaw/agents/*/workspace/memory/`
- Plus `~/kb/`
- Recount the manifest on session start in case anything was added since 2026-05-01

## Your job (high-level)
Run sub-phases 6.9a through 6.9d as described in the spec. Sub-phase 6.9e is Ricky's manual review and you DO NOT run it — you produce the artefacts and hand back. Sub-phase 6.9f is downstream (Phase 7).

Concretely:

### 6.9a — Parallel folder scans (READ-ONLY)
Dispatch 8-10 Codex BUILDER spawns via ACP, batched by 5-7 folders each. Each spawn uses the briefing in PHASE-6.9-SPEC.md §6.9a verbatim, with the batch list inserted. Output: `~/builds/agent-rebuild/scans/scan-<batch-id>.yaml`

### 6.9b — Consolidate into two canonical inventories
One Codex BUILDER reads all scan files + the existing automation-blueprint.md + INDEX.md + EXECUTIVE-BUILD-PLAN.md. Produces:
- `~/builds/agent-rebuild/folder-inventory.md`
- `~/builds/agent-rebuild/idea-inventory.md`

### 6.9c — Per-agent ownership manifests
One Codex BUILDER produces:
- `~/builds/agent-rebuild/ownership-manifests/<agent>.md` (10 files, one per fleet agent: main, operations, marketing, team, diagnostics, alex-cs, arlo-website, backmarket, parts, ferrari)
- `~/builds/agent-rebuild/ownership-orphans-and-conflicts.md`

### 6.9d — QA cross-check
Independent Codex QA spawn produces:
- `~/builds/agent-rebuild/QA-6.9-report.md`
Patch P1 discrepancies into the inventories before signing off.

## Spawn dispatch

This work is the gstack-installed Claude Code's job to orchestrate. Use Codex BUILDER spawns via ACP for the actual scanning — DO NOT scan the folders yourself in the main session; that's what burns context and misses things.

Probe Codex availability at session start:
```bash
node "/home/ricky/.claude/plugins/cache/openai-codex/codex/1.0.3/scripts/codex-companion.mjs" setup --json
```

If permission gate fires, run that probe directly to re-prime, then retry the spawn.

## Working directory
Run from `/home/ricky/builds/agent-rebuild/` so paths are predictable. The session is allowed to write under that dir + the explicit output paths in the spec. Nothing else.

## When to checkpoint with Ricky
- After 6.9a finishes — confirm scan count = 50 folders, ask if any obvious gaps before consolidating
- After 6.9b — show him the structure of folder-inventory.md and idea-inventory.md, confirm the schema before generating ownership manifests
- After 6.9d — present the QA report and patch summary, hand off to his manual review

## What "done" looks like
- `~/builds/agent-rebuild/folder-inventory.md` exists with 50 rows, all populated
- `~/builds/agent-rebuild/idea-inventory.md` exists with every idea from automation-blueprint.md preserved + new ones surfaced from scans
- 10 ownership manifests exist
- Orphans/conflicts file exists
- QA report exists with no unpatched P1s
- Ricky has been handed back the artefacts for review (sub-phase 6.9e — his hands, not yours)

Then write a fresh handoff at `~/claude-audit-rebuild/.remember/remember.md` summarising: what was scanned, what's in each inventory, where Ricky should start reviewing.

## Tone + working preferences (from CLAUDE.md)
- Terse, specific, no sycophancy openers
- Em-dashes are out
- Swearing is fine when it lands
- Ask before destructive ops; this whole phase has zero destructive ops by design
- Use TaskCreate to track sub-phases as you go

Begin by confirming you've read the spec and listing the 8-10 batches you intend to dispatch. Wait for Ricky's go-ahead before launching parallel spawns — he wants to confirm the batch shape first.
```

---

## Notes for Ricky on the new session

- **Where to paste:** spawn a fresh `claude` session at `~/builds/agent-rebuild/` (or anywhere — the prompt resolves paths). Paste the entire block above.
- **First message you'll get:** confirmation of read-through plus a proposed batch list. Verify it covers all 50 folders, then say "go".
- **You do nothing during 6.9a-6.9d** except checkpoint when the new session asks.
- **Your real work is 6.9e** — reading the inventories. That's hours, not minutes; spread it over sittings.
- **If something feels wrong mid-session:** the new Code session should stop and report. The hard rules are binding; if it proposes any move/delete/edit, it's broken the contract.

## What this session leaves behind for the new one

- `PHASE-6.9-SPEC.md` (the bible)
- `PHASE-6.9-HANDOFF-PROMPT.md` (this file)
- Existing `automation-blueprint.md` (~58 ideas already captured — gets absorbed)
- Existing `system-rethink.md` (the why)
- Existing `EXECUTION-PLAN.md` (gets a new 6.9 row)

Nothing else needs to change before you start the new session.

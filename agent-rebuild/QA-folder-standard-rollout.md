# QA Report: Folder Standard Rollout to agent-rebuild

**Run date:** 2026-04-30 (auditor session, real-world)
**Auditor:** general-purpose subagent (independent of Claude Code session that did the work)
**Scope:** verify reorganization of `~/builds/agent-rebuild/` per `briefs/folder-standard.md`

## Summary
- FAILs: 4
- WARNINGs: 9
- PASSes: 17
- One-line verdict: Reorganization mostly compliant with the standard, but missing required `briefs/INDEX.md` and `docs/audits/INDEX.md` (hard-rule trigger fired by file counts), one source file (`PLAN-CORE-FILES-AND-RETIREMENT.md`) was deleted with no destination found, and several KB references still point to the old root location of `ricky-systems-dump.md`.

---

## Section 1: Standard compliance

Hard rules enumerated from `briefs/folder-standard.md` lines 158-166:

1. **`INDEX.md` is mandatory at every project root** — **PASS**. `~/builds/agent-rebuild/INDEX.md` exists (6,214 bytes, last modified 2026-05-02 06:59).
2. **Nothing canonical at project root except `INDEX.md` and `README.md`** — **WARNING**. INDEX.md and README.md present, plus the explicitly-permitted 5 6.9e review files (folder-inventory.md, idea-inventory.md, ownership-orphans-and-conflicts.md, QA-6.9-report.md, RICKY-OVERRIDES-6.9.md). Treated as documented exception per INDEX.md "kept at root" callout. Strictly speaking the hard rule is violated; the standard's own "pre-standard folder being absorbed" clause (lines 199-208) covers this with the "leave the rest at root, marked as pending-classification in INDEX.md" provision. INDEX.md does mark them as temporary.
3. **New ideas land in `briefs/`, not in `memory/`, not at the root, not in `scratch/`** — **PASS**. `briefs/` exists and contains 18 files + `c14/` subdir. No `scratch/` exists, no new ideas observed at root.
4. **Decisions get logged in `decisions/` immediately** — **PASS** (vacuously). `decisions/` directory exists but is empty. INDEX.md acknowledges this and explicitly defers backfill ("Backfill of historical decisions deferred to Phase 7").
5. **Closing work means moving to `archive/` with a date and reason** — **PASS**. `archive/2026-04-01/` exists with date-stamped subfolder containing prior cleanup output (reference, root-docs, technical, README.md).
6. **INDEX.md must be updated when you add a brief, log a decision, or archive something** — **PASS**. INDEX.md "Last updated: 2026-05-02 06:58 UTC" matches the reorganization timing; current state, structure, and key documents sections are populated.

**Additional implicit rules from the structure section:**

- **`briefs/INDEX.md` REQUIRED if briefs/ has more than 5 files** (line 27) — **FAIL**. `briefs/` contains 18 files (well over 5). No `briefs/INDEX.md` exists.
- **`docs/INDEX.md` REQUIRED if docs/ has more than 5 files** (line 30) — **PASS**. `docs/` root contains only 3 files (system-rethink.md, RECOVERY-RUNBOOK.md, telegram-channels.md). Threshold not crossed at this level.
- **Sub-folder INDEX.md when docs/ becomes deeply nested** (line 136) — **FAIL**. `docs/audits/` has 22 files; spec implies sub-folder INDEX.md is required ("each sub-folder gets its own INDEX.md"). No `docs/audits/INDEX.md`. Same applies to `docs/inventories/ownership-manifests/` (10 files) and `docs/inventories/scans/` (9 files) — neither has an INDEX.md, nor does `docs/inventories/`.

---

## Section 2: INDEX.md accuracy

Every link in INDEX.md `Key documents` (lines 43-68) was checked. All 19 enumerated link targets resolve:

- PASS: `briefs/folder-standard.md`, `briefs/PHASE-6.9-SPEC.md`, `briefs/PHASE-6.9-HANDOFF-PROMPT.md`, `briefs/PHASE-6.95-SECURITY-FOLLOWUP-SPEC.md`, `folder-inventory.md`, `idea-inventory.md`, `ownership-orphans-and-conflicts.md`, `QA-6.9-report.md`, `RICKY-OVERRIDES-6.9.md`, `docs/system-rethink.md`, `docs/RECOVERY-RUNBOOK.md`, `docs/telegram-channels.md`, `docs/audits/`, `docs/inventories/scans/`, `docs/inventories/ownership-manifests/`, `briefs/automation-blueprint.md`, `briefs/CODEX-BRIEFS.md`, `briefs/PHASE-2-MANIFEST-2026-04-29.md`, `briefs/c14/`.

- PASS: INDEX.md line 31 claims `briefs/ — 19 entries`. Actual: 18 files + 1 subdirectory (`c14/`) = 19 entries (interpreting subdirs as entries). Defensible.

- PASS: INDEX.md line 33 claims `docs/` has "3 root files + audits/ (22 historical analysis reports) + inventories/". Verified: 3 root files; `docs/audits/` contains exactly 22 files; `docs/inventories/` contains the two named subdirs.

- PASS: INDEX.md line 31 claims "Idea-capture target" for briefs/ — matches standard (line 91-92).

- WARNING: INDEX.md line 66 references "BRIEF-01 through BRIEF-06 + BRIEF-C14/C15/C16 + BRIEF-VPS-AUDIT.md" without individual links. All 10 BRIEF files exist in `briefs/`. Soft-link only — no broken target, but a fresh session has to grep to find them.

- WARNING: INDEX.md "Structure" section lists `briefs/`, `decisions/`, `docs/`, `archive/`, `data/`, `fixtures/`, `technical/`, `__pycache__/`. Matches reality.

---

## Section 3: Root contents check

`ls -la ~/builds/agent-rebuild/` actual contents:

**Files at root:**
- INDEX.md — PASS (allowed)
- README.md — PASS (allowed)
- folder-inventory.md — PASS (explicitly-allowed 6.9e exception)
- idea-inventory.md — PASS (explicitly-allowed 6.9e exception)
- ownership-orphans-and-conflicts.md — PASS (explicitly-allowed 6.9e exception)
- QA-6.9-report.md — PASS (explicitly-allowed 6.9e exception)
- RICKY-OVERRIDES-6.9.md — PASS (explicitly-allowed 6.9e exception)

No stray files at root. **PASS** for files.

**Subdirectories at root:**
- briefs/ — PASS (expected)
- decisions/ — PASS (expected)
- docs/ — PASS (expected)
- archive/ — PASS (expected)
- data/ — PASS (expected)
- fixtures/ — PASS (expected)
- technical/ — PASS (expected)
- __pycache__/ — WARNING (expected per INDEX.md note "Gitignore target", but it should NOT be there — Python should not be running in agent-rebuild root, and the `c14_repair_history_rerun.py` lives at `briefs/c14/c14_repair_history_rerun.py` so the cache is orphaned. Contents: `c14_repair_history_rerun.cpython-312.pyc`. INDEX.md tags it for gitignore but the directory itself remains as cruft.)

No unexpected subdirectories. **PASS** with one cruft warning.

---

## Section 4: Subfolder contents match claims

### `briefs/` — claimed 18 files + c14/ subdir
Actual: 18 files + c14/ subdir. Files compared one-by-one against the claimed list:

- PASS: PHASE-6.9-SPEC.md, PHASE-6.9-HANDOFF-PROMPT.md, PHASE-6.9-SCAN-BRIEFING.md, PHASE-6.95-SECURITY-FOLLOWUP-SPEC.md, PHASE-2-MANIFEST-2026-04-29.md, BRIEF-01-HUGO-SCRIPT-AUDIT.md, BRIEF-02-SEARCH-NOT-LOAD.md, BRIEF-03-JARVIS-CONTEXT-AUDIT.md, BRIEF-04-MARKETING-INTELLIGENCE.md, BRIEF-05-SYSTEM-AUDIT-DIGEST.md, BRIEF-06-AUTOMATION-BLUEPRINT.md, BRIEF-C14-REPAIR-HISTORY-MINING.md, BRIEF-C15-MAIN-BOARD-CLEANUP-ANALYSIS.md, BRIEF-C16-SOP-EDGE-CASES-AND-VERIFICATION.md, BRIEF-VPS-AUDIT.md, CODEX-BRIEFS.md, automation-blueprint.md, folder-standard.md — all present.

- WARNING: `BRIEF-VPS-AUDIT.md` was previously named `vps-audit.md` at root (per `git ls-tree HEAD`). It was renamed during the move. No mention of this rename in INDEX.md or in any commit message visible from the working tree. Minor — a consumer searching for "vps-audit.md" will miss it.

### `briefs/c14/` — claimed `c14_repair_history_rerun.py`
- PASS: contains exactly that one file.

### `docs/` root — claimed `system-rethink.md`, `RECOVERY-RUNBOOK.md`, `telegram-channels.md`, plus audits/ and inventories/
- PASS: all three files present, both subdirs present, no extras.

### `docs/audits/` — claimed 22 files
- PASS: count is 22. Files: api-credentials-status.md, buyback-rebuild-verification.md, cron-audit.md, diagnostic-turnaround-analysis.md, hugo-script-audit.md, hugo-scripts-test-results.md, jarvis-context-audit.md, jarvis-handoff-executive-plan.md, journey-sop-gap-analysis.md, main-board-cleanup-analysis.md, marketing-intelligence-audit.md, marketing-intelligence-fix-report.md, memory-archive-report.md, repair-history-analysis.md, RETIREMENT-AUDIT-2026-04-29.md, ricky-systems-dump.md, script-test-results.md, search-not-load-research.md, slack-intake-readiness.md, sop-edge-cases-and-verification.md, system-audit-digest.md, systems-deep-map.md.

### `docs/inventories/` — claimed two subdirs
- PASS: `ownership-manifests/` (10 files: alex-cs, arlo-website, backmarket, diagnostics, ferrari, main, marketing, operations, parts, team) and `scans/` (9 files: scan-A.yaml through scan-I.yaml).

### Source files lost in transit
- **FAIL**: `agent-rebuild/PLAN-CORE-FILES-AND-RETIREMENT.md` was tracked in git HEAD at the root, is now `D` (deleted) per `git status --short`, and a `find` across the entire `agent-rebuild/` tree returns zero matches. Either it was deliberately removed without being moved (no archive entry, no mention in INDEX.md), or it was lost. The reorganization claim ("49 root files moved") does not square with this — one file appears to have been deleted outright.

### Unexpected files
None observed in subfolders beyond what was claimed.

---

## Section 5: Path references in active files

References extracted via `grep -nE "agent-rebuild/[A-Za-z0-9._/-]+"`:

### `~/CLAUDE.md`
- No `agent-rebuild/<file>.md` references requiring move-tracking found beyond the prose context. **PASS**.

### `~/claude-audit-rebuild/.remember/remember.md`
- References `briefs/folder-standard.md`, `briefs/PHASE-6.95-SECURITY-FOLLOWUP-SPEC.md`, `briefs/PHASE-6.9-SPEC.md` — all exist. **PASS**.

### `~/claude-audit-rebuild/EXECUTION-PLAN.md`
- Line 72, 137: `~/builds/agent-rebuild/captures/backlog.md` — **WARNING (expected stale)**. Path does not resolve. References Phase 6.5 capture-to-ship infrastructure that hasn't been built. Flagged in task brief as legitimately stale.
- Line 204: `~/builds/agent-rebuild/docs/RECOVERY-RUNBOOK.md` — **PASS**.
- Line 270: `~/builds/agent-rebuild/RUNBOOK.md` — **WARNING**. Path does not resolve. Brief says this would be "Live document, owned by Operations" — also unbuilt infrastructure (Phase 7+); marking expected stale.
- Line 405: `~/builds/agent-rebuild/WORKSPACE-DOCS-MIGRATION-2026-04-29.md` — **WARNING**. Path does not resolve. Generated report; may have been intentionally not retained or never created. Not in any subfolder. Mark stale.
- Line 456: `~/builds/agent-rebuild/COMPROMISES-2026-04-29.md` — **WARNING**. Path does not resolve. Same status as above — generated session-end report, not preserved.

### `~/claude-audit-rebuild/PLAN.md`
- No new agent-rebuild references unique to this file beyond what's already covered. **PASS**.

### `~/builds/agent-rebuild/idea-inventory.md`
- `briefs/automation-blueprint.md` — **PASS**.
- `briefs/PHASE-6.9-SPEC.md` — **PASS**.
- `docs/audits/sop-edge-cases-and-verification.md` — **PASS**.
- `README.md` (relative to agent-rebuild root) — **PASS**.

Summary: all moved-file paths in the four patched docs resolve correctly. The only unresolved paths point to genuinely-unbuilt infrastructure (captures/backlog, RUNBOOK.md, WORKSPACE-DOCS-MIGRATION, COMPROMISES) and are flagged as expected stale.

---

## Section 6: Other agent / KB references

Sweep across `~/.openclaw/agents/*/workspace/*.md` (top-level only) and `~/.openclaw/shared/*.md`:

- `~/.openclaw/agents/main/workspace/AGENTS.md:134` references `~/builds/agent-rebuild/EXECUTION-PLAN.md` — **WARNING**. There is no `EXECUTION-PLAN.md` at `~/builds/agent-rebuild/`. The actual plan lives at `~/claude-audit-rebuild/EXECUTION-PLAN.md`. This was likely already stale before the reorganization (not introduced by it) — flagging because the line is in an active agent file.

- `~/.openclaw/agents/main/workspace/USER-APPENDIX.md:32` and `USER.md:144` reference `~/builds/agent-rebuild/captures/backlog.md` — **WARNING (expected stale)**. Same captures/ infrastructure that hasn't been built.

Sweep across `~/kb/`:

- `~/kb/README.md:30` references `/home/ricky/builds/agent-rebuild/technical/control/kb-verification-ledger-2026-03-31.md` — **PASS**. Path resolves.
- `~/kb/system/knowledge/kb-promotion-map.md:8-9`, `obsidian-vault-structure.md:9`, `decisions/2026-04-01-openclaw-kb-boundary.md:31` reference `technical/evidence/documentation-rebuild-worklog-2026-03-31.md` and `technical/control/kb-verification-ledger-2026-03-31.md` — **PASS**. Both resolve.
- **FAIL**: Three files in KB reference `/home/ricky/builds/agent-rebuild/ricky-systems-dump.md` — this file was moved to `docs/audits/ricky-systems-dump.md` and the old root path no longer resolves. Affected:
  - `~/kb/SCHEMA.md:19` (`Ricky's systems dump | /home/ricky/builds/agent-rebuild/ricky-systems-dump.md`)
  - `~/kb/operations/sop-bm-trade-in.md:94`
  - `~/kb/operations/sop-walk-in-simple-repair.md:148`
  - `~/kb/operations/sop-walk-in-diagnostic.md:122`

The reorganizer's claim was "memory files left untouched (intentional)" — but KB references were not in scope of the listed 4 patched docs. These four KB references are legitimately broken by the move and were missed by the patch sweep.

---

## Section 7: Anything missed

- **FAIL: Lost source file.** `PLAN-CORE-FILES-AND-RETIREMENT.md` was tracked in git, was deleted in the working tree, and is not present anywhere in the new structure. Either an intentional drop with no documented reason, or accidental deletion. Either way, the reorganization narrative ("49 root files moved into …") needs to account for it.

- **WARNING: `__pycache__/` is dead weight at root.** The `.py` file it would cache is at `briefs/c14/c14_repair_history_rerun.py`, not at root. Running the script from `briefs/c14/` would create `briefs/c14/__pycache__/` instead. The root `__pycache__/` is leftover from when the .py file was at root and should be archived or deleted (not just gitignored).

- **WARNING: `briefs/INDEX.md` and `docs/audits/INDEX.md` missing despite hard-rule trigger.** Standard explicitly says `briefs/INDEX.md` is REQUIRED if briefs has >5 files (line 27); `docs/INDEX.md` likewise (line 30); deeper sub-folders need their own (line 136). With 18 briefs + 22 audits + 10 manifests + 9 scans, four sub-folder INDEX.md files are missing. If the agent-rebuild rollout is the proof-of-concept for Phase 7, this is a noteworthy gap — Phase 7 will inherit the precedent.

- **WARNING: `decisions/` is empty even though the standard says decisions in chat "don't exist for future sessions."** Hard rule 4 is technically not violated (no new decisions made post-rollout), but 2026-05-02 itself involved at least three decisions worth logging (folder standard approved with revisions, FerrariBot split, anti-fab protocol). INDEX.md acknowledges and defers this; flagging because the standard's spirit is "log immediately."

- **WARNING: `BRIEF-VPS-AUDIT.md` was renamed during the move.** Old name `vps-audit.md`. No rename note in INDEX.md or any visible commit. A consumer searching by old name will fail.

- **WARNING: AGENTS.md SO-3 references a non-existent `~/builds/agent-rebuild/EXECUTION-PLAN.md`.** Pre-existing, not caused by this reorg, but reorganizer was patching path references and missed an active agent file.

- **WARNING: `technical/` was left as-is.** INDEX.md "Open questions" already calls this out. Not a finding against the reorganization, but a fresh session lands on `technical/` and has to discover it's pre-standard. Acceptable per the standard's "messy folder being absorbed" clause.

- **WARNING: `decisions/` directory is genuinely empty (no `.gitkeep`).** May not survive a `git clean` or fresh clone. Cosmetic.

- **WARNING: `git status` shows 48 changes pending, none committed.** The reorganization is uncommitted. If anything goes wrong before the commit lands, the work is in the working tree only. This is a session-state observation, not a structural fault — but worth flagging since the user may not realize the rollout hasn't been atomically captured.

---

End of report.

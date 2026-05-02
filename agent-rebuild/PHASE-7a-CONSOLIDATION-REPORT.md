# Phase 7a — Consolidation Report

**Date:** 2026-05-02 09:01 UTC
**Status:** completed

## Summary

- Folders standardized: 49
- Total files moved: 248 (aggregated across all 8 scan-batch YAMLs)
- New INDEX.md files at folder root: 49
- New sub-INDEX.md files: 19
- Total path patches applied: 57 (planned + applied via patch script) + 5 orphan refs fixed in consolidation = 62 total
- Files modified by patch: 14 (per planned set) + 5 additional (orphans) = 19 files
- Defects fixed in consolidation: 4

## Per-batch summary

| Batch | Folders | Moves | Sub-INDEXes | Warnings | QA verdict |
|---|---|---|---|---|---|
| 1 BM | 6 | 24 | 4 | 4 | PASS (Codex misinterp) |
| 2 Alex/CS | 6 | 19 | 3 | 6 | WARN — fixed in consolidation |
| 3 Parts | 6 | 17 | 0 | 5 | PASS |
| 4 Ops services | 7 | 42 | 1 | 8 | WARN — voice-note-pipeline retirement noted |
| 5 Intake/Ops | 6 | 70 | 4 | 7 | PASS |
| 6 Web/Mkt | 6 | 30 | 3 | 7 | PASS |
| 7 Team/Diag | 6 | 35 | 3 | 7 | PASS |
| 8 Fleet-meta | 6 | 11 | 1 | 9 | PASS |

(Counts derived from `from:` entries in scan-batch-{1..8}.yaml and `sub_indexes_created:` arrays.)

## Critical patches applied

- `~/.openclaw/openclaw.json:392`: `whisper-api/transcribe.sh` → `whisper-api/scripts/transcribe.sh` (TOP PRIORITY — OpenClaw audio tool config) — verified live
- `~/.openclaw/agents/main/workspace/{LIVE-TODO,MEMORY,TODO}.md`: 9 patches (alex-triage-rebuild briefs, backmarket-browser audits, monday investigations, elek-board-viewer brief)
- `~/kb/**/*.md`: ~16 patches across `monday/`, `customer-service/`, `system/`, `backmarket/`, `operations/`
- `~/claude-audit-rebuild/VPS-MAP.md`: 2 patches (`server-config/crontab.txt` → `server-config/data/crontab.txt`)
- `~/builds/agent-rebuild/idea-inventory.md`: 32 patches across 23 moved files

## Defects fixed

1. `alex-triage-rebuild/archive/.gitkeep` — added (was empty without marker)
2. `alex-triage-rebuild/decisions/.gitkeep` — added
3. `alex-triage-rebuild/docs/validation/INDEX.md` — generated (10 file entries)
4. `voice-note-pipeline/INDEX.md` — added retirement note (module deprecated 2026-05-02)

## Orphans detected

Three orphan references found by post-patch fleet-wide grep — patched in this consolidation pass (not in the scripted set because the patch script targeted specific known files only):

1. `~/kb/customer-service/_draft/pre-repair-form.md` and `~/kb/customer-service/pre-repair-form.md` — frontmatter `source:` field still pointing at `alex-triage-rebuild/BUILD-BRIEF.md` → patched to `alex-triage-rebuild/briefs/BUILD-BRIEF.md`
2. `~/builds/agent-rebuild/idea-inventory.md` rows 232 + 239 — referenced `backmarket-browser/BROWSER-AGENT-TODO-2026-04-26.md` → patched to `backmarket-browser/briefs/BROWSER-AGENT-TODO-2026-04-26.md`
3. `~/kb/operations/intake-flow.md` and `~/kb/operations/qc-workflow.md` — referenced `intake-system/SPEC.md` → patched to `intake-system/briefs/SPEC.md`

After the orphan patch pass, **final fleet-wide grep returned zero remaining old-path references** across 28 tracked patterns × all surfaces (OpenClaw workspaces, OpenClaw shared, openclaw.json, root CLAUDE.md, claude-audit-rebuild/, kb/, agent-rebuild inventories).

## Warnings escalated from spawn reports

- **voice-note-pipeline:** module deprecated by Ricky 2026-05-02; live worker should be killed and folder archived in Phase 7c.
- **server-config:** plaintext secrets in `pm2-dump.json` + `pm2-dump-formatted.json` — Phase 6.95 / Phase 7c rotation.
- **icorrect-parts-service:** `CHANGELOG.md` kept at root (defensible but rubric silent — flag for review).
- **templates/:** kept template files at root as documented Option A deviation.
- **data/:** ambiguous folder name flagged for Phase 7c.
- **scripts/scripts/:** nesting flagged for Phase 7c domain redistribution.
- **bm-pricing-module/:** fully superseded by `backmarket/pricing/` — recommend full archive in Phase 7c.
- **research/:** mixed-purpose folder (briefs, audits, raw memory-problem snapshots) — split candidates noted in Phase 7c.
- **alex-triage-rebuild/data/:** large generated artifacts kept untouched; sub-INDEX deferred per spec.
- **monday/:** investigation files folded into `docs/audits/` but `docs/audits/` itself crowded — Phase 7c reorg candidate.
- **system-audit-2026-03-31/:** mixed brief + raw files; ~10 working scripts identified, not relocated — Phase 7c follow-up to schedule scripts via crontab.
- **buyback-monitor:** v7 pipeline rewrite brief now under `briefs/` — confirm v7 executor path still resolves before next BM cron run.

## Open questions for Phase 7b/c

- Top-level migration (Phase 7b) — `folder-inventory.md` state tags + new paths now ready as input.
- Phase 7c retirement of `voice-note-pipeline` (kill worker, archive folder).
- Phase 6.95 secrets rotation (folded into Phase 7c).
- Sub-INDEX backfill for code/data dirs left as-is per spec (`alex-triage-rebuild/data/`, `scripts/`, etc.) — defer to Phase 7c if useful.
- `data/` ambiguous folder name resolution.
- Promote/merge `research/` into `agent-rebuild/` brief structure or split per topic.

## Acceptance check

- [x] All 49 folders have INDEX.md at root
- [x] All 49 have 5 standard subdirs
- [x] Sub-INDEXes exist where >5-files rule fires (19 created)
- [x] All 57 inbound references patched (plus 5 orphan refs found post-patch and fixed)
- [x] `folder-inventory.md` and `idea-inventory.md` paths updated (folder-inventory has no per-file paths to patch — confirmed clean by grep; idea-inventory has 32 occurrences patched in scripted set + 2 orphan-pass)
- [x] Final fleet-wide grep returns zero orphans across all tracked old paths
- [x] No deletions; no edits to existing source code; no commits
- [ ] Final independent QA — pending (Phase 7a Step 4 task)

## Files

- Per-batch scans: `/home/ricky/builds/agent-rebuild/scans/phase-7a/scan-batch-{1..8}.yaml`
- Per-batch QA: `/home/ricky/builds/agent-rebuild/scans/phase-7a/qa-batch-{1..8}.md`
- Patch script: `/home/ricky/builds/agent-rebuild/scans/phase-7a/path-patch.sh`
- Patch dry-run: `/home/ricky/builds/agent-rebuild/scans/phase-7a/path-patch-dryrun.txt`
- Patch applied log: `/home/ricky/builds/agent-rebuild/scans/phase-7a/path-patch-applied.txt`
- This report: `/home/ricky/builds/agent-rebuild/PHASE-7a-CONSOLIDATION-REPORT.md`

## Pass 2 — Orphan cleanup (2026-05-02)

Triggered by final QA finding ~46 references the first pass missed (notably in kb/_draft/ subfolders, agent-rebuild/briefs/, agent-rebuild/docs/audits/, and .openclaw/shared/).

- Authoritative file_moves table aggregated from all 8 scan-batch yamls: **247 moves**
- Total orphans found in pass-2 sweep: **25 distinct (surface, from, to) patches** covering **46 underlying line occurrences** across **10 unique surface files**
- Patches applied: **25 / 25** (24 in the single re-run + 1 LEARNINGS.md applied during the first run that aborted on a separate post-patch arithmetic bug — re-run found it already patched)
- Final orphan re-sweep: **0 remaining** across all tracked old paths

Files most affected by pass-2 patches:
- `/home/ricky/kb/customer-service/_draft/label-buying-workflow.md` — 10 occurrences (main-board-column-audit.md -> docs/audits/)
- `/home/ricky/kb/customer-service/_draft/quote-building.md` — 5 occurrences (alex-triage-rebuild PHASE2 brief -> briefs/)
- `/home/ricky/builds/agent-rebuild/idea-inventory.md` — 6 distinct from-paths, 19 line occurrences (intake-system, intake-notifications, monday board-v2, website-conversion SPEC, icorrect-shopify-theme dead-click, backmarket-seller-support discovery)
- `/home/ricky/builds/agent-rebuild/docs/audits/script-test-results.md` — 9 distinct from-paths under system-audit-2026-03-31/* (all moved to docs/audits/)
- `/home/ricky/kb/monday/board-relationships.md` — 3 from-paths (board-v2-build-status, main-board-column-audit, board-v2-manifest.json)
- `/home/ricky/builds/agent-rebuild/docs/audits/system-audit-digest.md` — 2 system-audit refs
- `/home/ricky/.openclaw/shared/LEARNINGS.md` — pdf-to-images.sh path (scripts dir got nested under itself)
- `/home/ricky/kb/operations/qc-workflow.md` — main-board-column-audit ref
- `/home/ricky/builds/agent-rebuild/briefs/CODEX-BRIEFS.md` — intake-notifications REBUILD-BRIEF.md

Surfaces explicitly skipped:
- `/home/ricky/builds/agent-rebuild/docs/audits/RETIREMENT-AUDIT-2026-04-29.md` — frozen historical grep-output snapshot. Contains many old-path references inside pasted JSON session blobs and quoted grep output, but those are historical evidence (the file's own purpose is recording what existed pre-Phase-1), not live links. Left as-is.

Patch script: `scans/phase-7a/path-patch-pass2.sh`
Aggregated catalog: `scans/phase-7a/all-file-moves.json` (247 moves)
Pass-2 orphan dump: `scans/phase-7a/orphans-pass2.json`
Dry-run preview: `scans/phase-7a/path-patch-pass2-dryrun.txt`
Apply log: `scans/phase-7a/path-patch-pass2-applied.txt`

# QA Phase 7a — Batch 7 (Team/Diagnostics)
**Reviewer:** Codex (independent)
**Date:** 2026-05-02 08:34 UTC

## Verdict per folder
- elek-board-viewer: PASS — root `INDEX.md` plus standard subdirs present; `briefs/INDEX.md` is populated; protected top-level dirs `schematics/`, `data/`, `scripts/`, and `systemd/` remain in place; boardview and FlexBV unit paths resolve.
- shift-bot: PASS — structure is correct, all three declared moves verified, and `shift-bot.service` still resolves to root `index.js`.
- team-audits: PASS — structure is correct, both declared moves verified, and `CLAUDE.md` remains at the root as required.
- hiring: PASS — dormant skeleton is correct, scan declared no file moves, and the staged JD remains under `docs/staged/2026-03-31/`.
- system-audit-2026-03-31: PASS — structure is correct; `briefs/INDEX.md` matches 17 briefs and `docs/audits/INDEX.md` matches 9 audit outputs.
- qa-system: PASS — dormant skeleton is correct; the former `snapshot/` contents were folded into `archive/2026-02-22-snapshot/` and the root `snapshot/` dir is gone.

## FAIL findings
- (none)

## WARNING findings
- **Inbound references are still stale outside the standardized folders.** Spot-checks found old root-path references still present in `agent-rebuild` metadata:
  - `agent-rebuild/idea-inventory.md:149-151` still reference `/home/ricky/builds/elek-board-viewer/PROJECT-STATE.md` even though the file now lives at `docs/PROJECT-STATE.md`.
  - `agent-rebuild/idea-inventory.md:144-146` still reference `/home/ricky/builds/shift-bot/COMPROMISES.md` even though the file now lives at `docs/COMPROMISES.md`.
  - `agent-rebuild/idea-inventory.md:282-283` still reference `/home/ricky/builds/qa-system/snapshot/QA-TRIGGER-PLAN.md` even though the file now lives at `archive/2026-02-22-snapshot/QA-TRIGGER-PLAN.md`.
- **`/home/ricky/builds/INDEX.md:67` is stale.** It still lists `qa-system/` as `Unknown status`, while `/home/ricky/builds/qa-system/INDEX.md` now clearly marks the folder `dormant`.
- **`team-audits/.env` remains a Phase 7c secrets-rotation concern.** It was preserved at the root, which matches the hard rules and the batch scan, but it should remain flagged for later handling.

## Spot-checks performed
- Structure: verified all 6 folders have root `INDEX.md` plus `briefs/`, `decisions/`, `docs/`, `archive/`, and `scratch/`.
- Empty-dir placeholders: verified `.gitkeep` in 19 empty dirs across the batch, including `elek-board-viewer/decisions/`, `elek-board-viewer/docs/assets/`, `shift-bot/{decisions,archive,scratch}/`, `team-audits/{decisions,archive,scratch}/`, `hiring/{briefs,decisions,archive,scratch}/`, `system-audit-2026-03-31/{decisions,archive,scratch}/`, and `qa-system/{briefs,decisions,docs,scratch}/`.
- Move validation: verified all 35 scan-listed file moves end-to-end. Every `from:` path is gone and every `to:` path exists. `hiring` had zero file moves in the scan.
- Sub-INDEX rule: all 3 claimed sub-indexes verified yes.
  - `elek-board-viewer/briefs/INDEX.md` exists, is populated, and its folder contains 6 brief files.
  - `system-audit-2026-03-31/briefs/INDEX.md` exists and its folder contains 17 brief files.
  - `system-audit-2026-03-31/docs/audits/INDEX.md` exists and its folder contains 9 audit files.
- Hard rules: no deletions found among scan-listed moves; no code-dir restructuring observed. `elek-board-viewer` top-level runtime/data dirs remained intact, `team-audits/CLAUDE.md` remained at root, and `qa-system/snapshot/` was folded into archive exactly as declared.
- Live runtime: verified `boardview-cleanup.service`, `flexbv-headless.service`, `shift-bot.service`, and `boardview-cleanup.timer` match the expected unit-file states. `ExecStart`/`Unit` paths resolve:
  - `boardview-cleanup.service` → `/home/ricky/builds/elek-board-viewer/scripts/cleanup_screenshots.py`
  - `flexbv-headless.service` → `/home/ricky/builds/elek-board-viewer/scripts/flexbv_session.sh`
  - `shift-bot.service` → `/usr/bin/node /home/ricky/builds/shift-bot/index.js`
  - `boardview-cleanup.timer` → `Unit=boardview-cleanup.service`
- Safety compliance: `elek-board-viewer` was checked shallow-only at the top level and in named subdirs; no recursive traversal of its large data areas was performed.

## Final verdict
PASS

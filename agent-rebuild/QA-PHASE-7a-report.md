# QA Phase 7a — Final Independent Review

**Reviewer:** general-purpose subagent (independent of build + consolidation)
**Date:** 2026-05-02 09:35 UTC

## Acceptance criteria

- [x] **All 49 folders have INDEX.md at root** — verified by `find /home/ricky/builds -maxdepth 2 -name INDEX.md | grep -v agent-rebuild` returning 50 (49 expected + the existing `builds/INDEX.md` map). Each of the 49 expected folders confirmed present individually.
- [x] **All 49 have 5 standard subdirs** — full fleet sweep over the 49 expected folders confirmed every folder has `briefs/`, `decisions/`, `docs/`, `archive/`, `scratch/`. Zero misses.
- [x] **Sub-INDEXes exist per >5-files rule** — sampled folders all comply: `backmarket/docs` (8, INDEX yes), `backmarket-browser/docs/audits` (7, INDEX yes), `alex-triage-rebuild/docs` (13, INDEX yes), `monday/docs` (7, INDEX yes), `server-config/docs` (16, INDEX yes), `elek-board-viewer/briefs` (6, INDEX yes). Total 19 sub-INDEXes per consolidation report.
- [x] **folder-inventory.md and idea-inventory.md paths updated** — 32 patches applied to idea-inventory in scripted set + 2 orphan-pass; spot-checked 17 distinct new path patterns all present, matching old paths absent. folder-inventory.md confirmed clean (no per-file paths to patch).
- [x] **No deletions or content edits beyond patches and .gitkeep/INDEX adds** — all source-code modifications flagged by per-batch QA (royal-mail-automation `dispatch.js`/`repairs-dispatch.js`/`buy-labels.js`, alex-triage-rebuild `scripts/intercom-cleanup-2025plus-dry-run.js`) confirmed pre-existing via mtime: Apr 22-26, well before the 2026-05-02 08:00 Phase 7a window. No post-consolidation source edits found by `find ... -newer PHASE-7a-CONSOLIDATION-REPORT.md`.
- [x] **Defects fixed verified** — all 4 confirmed:
  - `alex-triage-rebuild/archive/.gitkeep` exists (created 2026-05-02 08:48)
  - `alex-triage-rebuild/decisions/.gitkeep` exists (created 2026-05-02 08:48)
  - `alex-triage-rebuild/docs/validation/INDEX.md` exists with exactly 10 file entries listed
  - `voice-note-pipeline/INDEX.md` contains explicit retirement note ("Phase 7c retirement candidate: Module deprecated 2026-05-02")
- [WARN] **Live-runtime paths still resolve** — 19/19 sampled new paths exist on disk; 12/12 sampled crontab paths resolve; 5/5 sampled systemd ExecStart paths resolve. **However, the consolidation report's claim of "zero remaining old-path references" is incorrect — 4 stale references found in 3 KB files (see WARNING findings).** None are runtime-critical.

## Folders sampled (12)

| Folder | Verdict | Rationale |
|---|---|---|
| `backmarket` | PASS | Active INDEX template, 5 subdirs, `docs/INDEX.md` sub-index, all critical scripts/services intact at expected paths. |
| `backmarket-browser` | PASS | Active INDEX, sub-INDEXes for both `docs/` and `docs/audits/`, all 5 patched LIVE-TODO refs verified at new audit paths, sessions/profiles in `data/` left untouched. |
| `alex-triage-rebuild` | PASS (defects fixed) | Both `.gitkeep` defects fixed; `docs/validation/INDEX.md` has the required 10 entries; INDEX has full front-matter (note: time format truncated to date but other fields complete). |
| `icorrect-parts-service` | PASS | Live service preserved: `.env`, `src/`, `package.json` all at root; 5 standard subdirs created with `.gitkeep`s; `icorrect-parts.service` ExecStart `/usr/bin/node src/index.js` resolves. CHANGELOG at root flagged as documented WARN (defensible release-history file). |
| `icloud-checker` | PASS | Live service preserved; `src/` canonical kept; `SOP-BM-TRADEIN-CHECK.md` move to `docs/` confirmed; `kb/backmarket/spec-checker.md` ref now points at the new `docs/` path. |
| `monday` | PASS | All 5 patched files (`board-schema`, `automations`, `repair-flow-traces`, `target-state`, `main-board-column-audit`, `monday-automations-api-investigation`, browser-harness pair) confirmed at new locations and referenced correctly from kb/. `automation screenshots/` literal-space dir preserved per no-restructure rule. |
| `server-config` | PASS (with documented sensitivity) | Standard structure present; `pm2-dump*.json` retained at root with documented Phase 6.95/7c rotation plan; `data/crontab.txt` resolves and VPS-MAP.md patch verified. |
| `elek-board-viewer` | PASS | 4.5G live workspace preserved (`schematics/`, `data/`, `scripts/`, `systemd/` left in place); `briefs/INDEX.md` covers 6 brief files; `boardview` and `flexbv-headless` systemd unit paths still resolve; `briefs/CODEX-SCHEMATIC-BATCH-BRIEF.md` confirmed at new location. |
| `voice-notes` | PASS | Dead-template applied, "candidate for Phase 7c archive" recommendation present; standard skeleton built for consistency only. |
| `voice-note-pipeline` | PASS (with documented runtime conflict) | Retirement note added per defect-fix #4. `.voice-note-state.json` exists at BOTH root and `data/` — known issue per task brief, module retiring in Phase 7c, not flagging as Phase 7a defect. systemd `voice-note-worker.service` ExecStart `/home/ricky/builds/voice-note-pipeline/voice-note-worker.py` still resolves. |
| `whisper-api` | PASS | **CRITICAL PATCH VERIFIED**: openclaw.json line 392 now reads `command: "/home/ricky/builds/whisper-api/scripts/transcribe.sh"`; old root path string absent; new path on disk with execute bit (`-rwxr-xr-x`). |
| `templates` | PASS (documented deviation) | INDEX explicitly notes Option A deviation (template files at root); standard subdirs all present with `.gitkeep`s. |

All 12 sampled folders PASS structural and template checks.

## FAIL findings

None.

## WARNING findings

1. **Consolidation report's "zero orphans" claim is overstated.** Properly-scoped fleet-wide grep found 4 unpatched references in 3 KB files (these were NOT in the patch script's planned target set):
   - `/home/ricky/kb/operations/qc-workflow.md:9` references `/home/ricky/builds/monday/board-schema.md` — should be `monday/docs/board-schema.md`
   - `/home/ricky/kb/operations/qc-workflow.md:10` references `/home/ricky/builds/monday/repair-flow-traces.md` — should be `monday/docs/repair-flow-traces.md`
   - `/home/ricky/kb/monday/board-relationships.md:7` references `/home/ricky/builds/monday/board-schema.md` — should be `monday/docs/board-schema.md`
   - `/home/ricky/kb/monday/bm-devices-board.md:7` references `/home/ricky/builds/monday/board-schema.md` — should be `monday/docs/board-schema.md`

   **Severity:** WARN, not FAIL — these are KB cross-reference docs only; no runtime/agent loads are broken. The consolidation pass added 3 orphans to its planned-set fix, but missed this fourth orphan cluster (3 files × `board-schema.md` + 1 × `repair-flow-traces.md`). Easy mop-up patch in Phase 7c (or now if Ricky prefers).

2. **`voice-note-pipeline/.voice-note-state.json` runtime conflict.** Both root and `data/` copies exist (root is newer, mtime 09:05). Module retirement-flagged for Phase 7c — known issue per task brief, not a Phase 7a defect.

3. **`server-config/pm2-dump*.json` plaintext secrets at root.** Documented sensitivity, kept per Phase 6.95/7c rotation plan.

4. **`templates/` has files at root.** Documented Option A deviation in its INDEX.md.

5. **`alex-triage-rebuild/INDEX.md` `Last updated:` is date-only** (`2026-05-02`) rather than spec format `YYYY-MM-DD HH:MM TZ`. Cosmetic only — same minor issue flagged in qa-batch-2.

6. **Pre-existing dirty working tree.** Source-code modifications in `royal-mail-automation/{dispatch,repairs-dispatch,buy-labels}.js` and `alex-triage-rebuild/scripts/intercom-cleanup-2025plus-dry-run.js` all have mtimes Apr 22-26 (pre-Phase-7a). Per task brief, this is not a Phase 7a-induced issue.

7. **`builds/INDEX.md:67` still lists `qa-system/` as `Unknown status`** while folder INDEX is now `dormant`. Stale entry inherited from before; minor doc-sync cleanup.

## Patched-reference spot-checks

**18 distinct new-path patterns checked across openclaw.json, workspace md files, kb/, claude-audit-rebuild/, idea-inventory.md.**

| Surface | Old path absent | New path present | Status |
|---|---|---|---|
| `openclaw.json:392` (whisper-api/transcribe.sh) | yes | yes | **VERIFIED — CRITICAL** |
| `workspace/LIVE-TODO.md` (5 backmarket-browser refs + monday automations) | yes | yes | OK |
| `workspace/MEMORY.md` (alex-triage-rebuild build/remediation briefs) | yes | yes | OK |
| `workspace/TODO.md` (elek-board-viewer schematic batch brief) | yes | yes | OK |
| `kb/monday/main-board.md` (4 monday docs) | yes | yes | OK |
| `kb/monday/parts-board.md` (board-schema) | yes | yes | OK |
| `kb/operations/queue-management.md` (intake-system SPEC + monday repair-flow + target-state) | yes | yes | OK |
| `kb/system/runtime/browser-automation.md` (3 browser refs) | yes | yes | OK |
| `kb/backmarket/spec-checker.md` (icloud-checker tradein doc) | yes | yes | OK |
| `claude-audit-rebuild/VPS-MAP.md` (server-config crontab.txt) | yes | yes | OK |
| `idea-inventory.md` (17 distinct new paths sampled) | yes | yes | OK |
| `kb/operations/qc-workflow.md` | NO (still references old) | n/a | **WARN — orphan missed** |
| `kb/monday/board-relationships.md` | NO (still references old) | n/a | **WARN — orphan missed** |
| `kb/monday/bm-devices-board.md` | NO (still references old) | n/a | **WARN — orphan missed** |

**Critical:** openclaw.json:392 transcribe path verified at `whisper-api/scripts/transcribe.sh`: **YES.**

## Live-runtime paths

- **Crontab (12 sampled):** all 12 paths resolve (`buyback-monitor/run-daily.sh`, `run-weekly.sh`, `sync_tradein_orders.py`, `config/api-keys/refresh-searchable-mcp.sh`, `gsc_keepalive.sh`, `xero_keepalive.sh`, `agents/parts/workspace/scripts/update_usage_columns.py`, `openclaw/scripts/chrome-reaper.sh`, `health-check.sh`).
- **Systemd (5 sampled):** `voice-note-worker.service`, `telephone-inbound.service`, `llm-summary.service`, `shift-bot.service`, `icorrect-parts.service` — all ExecStart paths resolve to existing files.
- **All 19 sampled patched-target paths resolve on disk.**

## Final verdict

**PASS** (with WARNs)

Phase 7a folder-standard rollout is structurally complete and runtime-safe. All 49 folders have INDEX.md and the 5 standard subdirs; 19 sub-INDEXes are in place; all critical patches verified (especially the openclaw.json:392 whisper-api transcribe path); all sampled live-runtime paths still resolve. The 4 remaining orphan KB references (3 files, all pointing at the old `monday/board-schema.md` and `monday/repair-flow-traces.md` root paths) are documentation-only, do not break any runtime, and are easy mop-up for Phase 7c. The consolidation report's "zero orphans" claim should be amended; the actual count is 4. No FAIL findings; no source-code edits induced by Phase 7a; no broken inbound references on any runtime surface.

Recommended next: quick patch of the 4 remaining KB orphans (one sed pass), then Phase 7b/7c can proceed.

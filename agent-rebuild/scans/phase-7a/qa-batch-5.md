# QA Phase 7a — Batch 5 (Intake/Ops specs)
**Reviewer:** general-purpose subagent (Codex sandbox fallback)
**Date:** 2026-05-02 08:33 UTC

## Verdict per folder
- intake-notifications: PASS
- intake-system: PASS
- monday: PASS
- operations-system: PASS
- webhook-migration: PASS
- server-config: PASS

## FAIL findings
- (none)

## WARNING findings
- **Inbound references not yet patched (expected — consolidation pass responsibility, not this batch's).** Spot-checked refs still point at old paths and need patching by the consolidation spawn:
  - `kb/operations/queue-management.md:9` still references `/home/ricky/builds/intake-system/SPEC.md` (now at `briefs/SPEC.md`).
  - `builds/agent-rebuild/idea-inventory.md:77` still references `/home/ricky/builds/intake-system/plan.md` (now at `briefs/plan.md`).
  - `kb/customer-service/_draft/monday-workflow-map.md` (and other KB files) still reference `monday/automations.md`, `monday/repair-flow-traces.md` (now under `docs/`). Scan flagged 50+ refs of this kind.
  - `claude-audit-rebuild/VPS-MAP.md:44` still references `builds/server-config/crontab.txt` (now at `data/crontab.txt`).
  - `builds/agent-rebuild/idea-inventory.md:67,74,78,89` still reference `webhook-migration/TODO-*` and `execution-checklist-shopify-contact-form.md` (moved to `scratch/` and `docs/` respectively).
  All of these were declared in the scan's `inbound_references` and `warnings` for the consolidation pass. Not a Phase-7a-batch failure.
- **`monday/automation screenshots/` subdir name contains a literal space.** Left as-is per "no restructuring" rule. Flagged in scan warnings for Phase 7c hygiene.
- **Pre-existing modifications and untracked code in `intake-system/backend/` and `monday/services/status-notifications/index.js`.** Verified by mtime (Apr 23–27, well before the 2026-05-02 Phase-7a run) — these are unrelated uncommitted work, not Phase-7a edits. Surfaced for visibility.
- **`intake-system/react-form` shows as a submodule with untracked content** in `git status` — pre-existing state, not Phase-7a-induced.
- **Pre-existing untracked operations-system docs** (`business-problem-frame.md`, `domains/README.md`, `ferrari-dependency-assessment-2026-04-24.md`, `ops-data-source-index.md`, `process-document-structure-template.md`, `system-audit-*.md`, `team-ownership-map.md`) — mtimes show pre-Phase-7a authorship. Phase 7a did not move or edit them, consistent with the scan's `file_moves: []` for this folder.

## Spot-checks performed
- Move spot-checks: 13 total (across all 6 folders). All `to:` files exist; all `from:` files gone.
  - intake-system: SPEC.md→briefs/, integrations.md→docs/, QA-PLAN-REVIEW.md→docs/audits/ (verified)
  - monday: board-schema.md→docs/, automation-audit.md→docs/audits/, automations-export.csv→data/, build-new-board.py→scripts/ (verified)
  - server-config: nginx.conf→docs/, crontab.txt→data/ (verified)
  - webhook-migration: plan-shopify-contact-form.md→briefs/, MASTER-TODO-2026-03-31.md→scratch/ (verified)
  - intake-notifications: REBUILD-BRIEF.md→briefs/, plan.md→briefs/ (verified)
- Sub-INDEX rule: 4 claimed sub-INDEXes verified yes
  - `intake-system/briefs/INDEX.md` — exists, 12 files in briefs (11 briefs + INDEX), >5 threshold satisfied.
  - `monday/docs/INDEX.md` — exists, 7 docs files at root of docs/ (>5 threshold).
  - `server-config/docs/INDEX.md` — exists, 16 config files (10 .service + 6 .conf + env-template), >5 threshold satisfied.
  - `server-config/data/INDEX.md` — exists, 8 data dumps, >5 threshold satisfied.
- Inbound references: 5 spot-checked (all still pointing at old paths — see WARNING findings; consolidation pass will patch).
- Existing-content-untouched: verified via git diff and mtime checks. The `M` entries in `git status` for code files in `intake-system/backend/`, `monday/services/status-notifications/`, and `operations-system/docs/domains/.../process-truth.md` all have mtimes from Apr 23–27, predating the Phase-7a run (May 2 08:25–08:28). No Phase-7a-induced content edits found.
- operations-system pre-existing docs/INDEX.md preserved: yes (1464 bytes, mtime 2026-04-25 05:55 UTC, content matches the Apr 25 version with "Operations System Docs Index" / domain-build-out plan; root INDEX.md cross-references it as authoritative.)
- Live-runtime: cron + systemd ExecStart resolves yes
  - `~/.config/systemd/user/intake-form.service` → `WorkingDirectory=/home/ricky/builds/intake-system/react-form/dist` (path exists; react-form/ untouched).
  - `~/.config/systemd/user/status-notifications.service` → `WorkingDirectory=/home/ricky/builds/monday/services/status-notifications` (path exists; services/ untouched).
  - crontab paths reviewed — no batch-5-folder references; safe.
- server-config secrets at root + flagged in INDEX SECURITY section: yes
  - `pm2-dump.json` (6910B) and `pm2-dump-formatted.json` (7671B) confirmed at `/home/ricky/builds/server-config/` root (NOT moved into `data/`).
  - Contents NOT read.
  - `server-config/INDEX.md` has explicit "## SECURITY warning" section flagging both files as plaintext-secrets-bearing, calling out Phase 7c (folded-in 6.95) as the redaction/rotation home.
- 5-subdir + INDEX skeleton verified for all 6 folders. .gitkeep present in all 18 empty subdirs checked across the batch.
- Hard rules: no deletions (every "deleted" git entry has its content present at a new path); only new untracked files (INDEX.md + standard subdirs + .gitkeep); no code-dir restructuring (frontend/, react-form/, backend/, supabase/, deploy/, services/, tools/ etc. all intact).
- Pricing assets at root: `intake-system/pricing-data.json` (45919B) and `intake-system/logo.png` (7129B) confirmed kept at root (per scan warning — referenced by frontend/react-form/backend imports).

## Final verdict
PASS

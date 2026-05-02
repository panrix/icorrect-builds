# monday

**State:** active
**Owner:** operations
**Purpose:** Primary workspace for Monday.com board rebuild assets, automation audits, schema docs, and integration scripts around the iCorrect main board.
**Last updated:** 2026-05-02 UTC

## Current state

### In flight
- Monday automations API investigation (private `/lite-builder/*` endpoint reverse-engineering) — see `docs/audits/monday-automations-api-investigation.md`.
- Browser-harness pilot for Monday UI automation — see `docs/audits/browser-harness-pilot-report.md` and `docs/browser-harness-monday-skill.md`.
- Status-notifications service running in `services/status-notifications/` (live).

### Recently shipped
- Status-notifications service deployed (Apr 27); see `services/status-notifications/`.
- Browser-harness pilot completed (Apr 23).
- Activity-issues report for week of Apr 20-26 generated (see `reports/`).

### Next up
- Rebuild v2 board automations from documented mapping (idea-inventory ID `dd5358d9`).
- Deactivate 8 stale old-board automations still firing against dropped columns (idea-inventory ID `7c96df22`).
- Load fake items and validate every major flow before migration (idea-inventory ID `120d3f70`).

## Structure

- `briefs/` — `cleanup-brief.md`, `QUERY-SPEC.md`, `target-state.md`. 3 files (under sub-INDEX threshold).
- `decisions/` — empty.
- [`docs/`](docs/INDEX.md) — 7 canonical reference files (automations, schema, repair-flow-traces, status-notification docs, etc.) + `audits/` (4 historical analysis reports). Has sub-INDEX.
- `archive/` — empty.
- `scratch/` — empty.
- `scripts/` — `build-new-board.py` (one-shot board build script).
- `data/` — `automations-export.csv`, `board-v2-manifest.json`.
- `reports/` — pre-existing dated reports (Apr 27 activity-issues exports).
- `services/` — pre-existing services subdir; `status-notifications/` is live.
- `automation screenshots/` — pre-existing screenshot folder (Mar 30 captures).

## Key documents

### Canonical reference (docs/)
- [`docs/automations.md`](docs/automations.md) — current Monday automations canonical reference (heavily linked from KB).
- [`docs/board-schema.md`](docs/board-schema.md) — board schema reference.
- [`docs/repair-flow-traces.md`](docs/repair-flow-traces.md) — repair flow traces (heavily linked from KB).
- [`docs/icorrect-status-notification-documentation.md`](docs/icorrect-status-notification-documentation.md) — status-notifications operational doc.
- [`docs/board-v2-build-status.md`](docs/board-v2-build-status.md) — v2 board build progress.
- [`docs/browser-harness-monday-skill.md`](docs/browser-harness-monday-skill.md) — browser harness Monday skill.
- [`docs/cowork-manual-setup-checklist.md`](docs/cowork-manual-setup-checklist.md) — cowork setup checklist.

### Audits (docs/audits/)
- [`docs/audits/automation-audit.md`](docs/audits/automation-audit.md) — full automation audit (32KB).
- [`docs/audits/browser-harness-pilot-report.md`](docs/audits/browser-harness-pilot-report.md) — pilot report (Apr 23).
- [`docs/audits/main-board-column-audit.md`](docs/audits/main-board-column-audit.md) — main board column audit (65KB).
- [`docs/audits/monday-automations-api-investigation.md`](docs/audits/monday-automations-api-investigation.md) — private API investigation (Apr 27).

### Briefs
- [`briefs/target-state.md`](briefs/target-state.md) — target-state board spec.
- [`briefs/QUERY-SPEC.md`](briefs/QUERY-SPEC.md) — query spec for the board.
- [`briefs/cleanup-brief.md`](briefs/cleanup-brief.md) — cleanup brief.

### Operational
- `README.md` — operational entry point.
- `services/status-notifications/` — live notification service.

## Warnings

- Many of the docs moved here (especially `docs/automations.md`, `docs/repair-flow-traces.md`, `docs/board-schema.md`, `docs/audits/main-board-column-audit.md`) are referenced extensively from `~/kb/` (60+ references). The Phase 7a consolidation pass is responsible for patching those references; do not rely on the KB links until that pass has run.

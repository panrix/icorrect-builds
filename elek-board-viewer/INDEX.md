# elek-board-viewer

**State:** active
**Owner:** diagnostics
**Purpose:** Diagnostics workspace for Apple Silicon MacBook logic-board repair. Headless FlexBV board-view stack, schematic index, board reference docs, and Codex-driven build plans for Elek's diagnostic tooling.
**Last updated:** 2026-05-02 08:30 UTC

## Current state

### In flight
- V3 infrastructure work driven by `briefs/CODEX-V3-INFRASTRUCTURE-BRIEF.md` (last touched 2026-04-23). PROJECT-STATE captures the current rebuild scope: lost board-reference / flow-QA scripts to be rebuilt from surviving outputs, A2681 pilot rewrite redo, then scale to remaining 13 board revisions.
- `flexbv-headless.service` and `boardview-cleanup.service` are systemd user units pointing at this folder; they remain live regardless of plan churn.

### Recently shipped
- 2026-04-11 to 2026-04-13 — schema spec + audit + remediation pass (see `docs/audits/`).
- 2026-04-23 — V3 infrastructure brief authored; PROJECT-STATE refreshed.

### Next up
- Review of recovered scripts vs lost ones (per PROJECT-STATE).
- Decide whether plan-v1/v2/v3 line in archive needs a fourth iteration or stays.

## Structure

- `briefs/` — 6 Codex briefs (prompt, remediation, repass, reviewer-QA, schematic-batch, V3-infrastructure). Has its own INDEX.
- `decisions/` — empty; backfill candidate in Phase 7c.
- `docs/` — canonical reference (PROJECT-STATE, board-reference, SCHEMA-SPEC) plus `audits/` (5 audit/QA/remediation reports).
- `archive/` — `2026-05-02-superseded-plans/` holds plan.md + PLAN-V2 + PLAN-V3 (versioned plans pulled from root per the folder-standard's "no versioned siblings at root" rule).
- `scratch/` — TODO + a stray exploration export (`diagnostics_complete_exploration-1.md`).
- `data/`, `diagnostics/`, `maps/`, `research/`, `schematics/`, `scripts/`, `systemd/` — existing data and code dirs, untouched per Phase 7a hard rule (top-level only). NB: this folder is 4.5G; the bulk lives in `data/` and `schematics/`.

## Key documents

- [`docs/PROJECT-STATE.md`](docs/PROJECT-STATE.md) — single source of truth for project status; read first
- [`docs/board-reference.md`](docs/board-reference.md) — board reference index
- [`docs/SCHEMA-SPEC.md`](docs/SCHEMA-SPEC.md) — schema spec for the schematic/board indices
- [`docs/audits/`](docs/audits/) — schema audit, QA, repass QA, remediation, review reports
- [`briefs/INDEX.md`](briefs/INDEX.md) — list of Codex briefs with one-line summaries
- [`archive/2026-05-02-superseded-plans/`](archive/2026-05-02-superseded-plans/) — plan.md + PLAN-V2 + PLAN-V3

## Open questions

- Are the systemd units (`flexbv-headless.service`, `boardview-cleanup.service`) the runtime-of-record? They reference `scripts/` paths inside this folder; any code moves must keep those paths stable.
- `diagnostics_complete_exploration (1).md` (now in scratch as `diagnostics_complete_exploration-1.md`) — was 33KB of exported exploration; is it still useful or archive-candidate?

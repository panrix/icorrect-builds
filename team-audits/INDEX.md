# team-audits

**State:** active
**Owner:** team
**Purpose:** Active audit project for mapping each team member's work, bottlenecks, and revenue impact from verifiable system data. Per-tech reports, the auditing framework, and supporting scripts (CDR-Monday matcher, weekly Roni report, daily team CSV export).
**Last updated:** 2026-05-02 08:30 UTC

## Current state

### In flight
- Audit framework live; per-tech subfolders in `reports/` (adil, andreas, ferrari, mykhailo, roni, safan) plus `monthly_quality_2026-02.md`.
- Ferrari tracking extension brief in `briefs/CODEX-EXTEND-FERRARI-TRACKING.md` (2026-04-14) — captured idea in `idea-inventory.md`: "Extend team_daily_csv.py with client-services metrics for Ferrari-style roles" (P3).

### Recently shipped
- 2026-04-23 — `scripts/` updated (CDR Monday matcher / weekly report tooling).

### Next up
- Run the workshop tech audit scripts to validate (P2 idea in `idea-inventory.md`).
- Update `roni_weekly_report.py` to include BM intake metrics (P2 idea).

## Structure

- `briefs/` — `CODEX-EXTEND-FERRARI-TRACKING.md`
- `decisions/` — empty
- `docs/` — `PROJECT_OVERVIEW.md` (canonical reference for what this project is)
- `archive/` — empty
- `scratch/` — empty
- `framework/` — existing audit framework (e.g. `AUDIT_FRAMEWORK.md`), untouched
- `reports/` — per-tech audit reports + monthly quality outputs
- `scripts/` — Python audit scripts (CDR matcher, daily/weekly exports)

Root files retained: `CLAUDE.md` (legacy in-folder Claude project memory), `.env` (per inventory: contains credential material — do not commit; folded into Phase 7c secrets rotation).

## Key documents

- [`docs/PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md) — what the project is, started 2026-02-26
- [`briefs/CODEX-EXTEND-FERRARI-TRACKING.md`](briefs/CODEX-EXTEND-FERRARI-TRACKING.md) — extend daily CSV with Ferrari-role metrics
- `framework/AUDIT_FRAMEWORK.md` — auditing framework
- `reports/` — per-tech audit outputs and monthly quality reports
- `scripts/` — supporting Python tooling

## Open questions

- `CLAUDE.md` at root is legacy from when this folder ran as a standalone Claude project. Keep, fold into a `docs/` reference, or archive when team-audits formally adopts agent-rebuild's manifest pattern?
- `.env` with credential material flagged in folder-inventory and `agent-rebuild/folder-inventory.md` line 76 — Phase 7c rotation candidate.

# repair-analysis

**State:** dormant (last activity: 2026-03-16)
**Owner:** operations
**Purpose:** Two standalone Python analysis scripts for repair profitability and device-by-repair breakdowns from Monday Main Board data (excludes BM/buyback). Scratch-flavored — likely an early version of work superseded by the system-audit-2026-03-31 pack.
**Last updated:** 2026-05-02 08:30 UTC

## Current state

Dormant. Last meaningful change: 2026-03-16. Reason for dormancy: the wider system audit on 2026-03-31 produced `repair_profitability_v2.py` and related artifacts under `system-audit-2026-03-31/`; these earlier scripts were not migrated forward and have no clear caller.

**Phase 7c review candidate:** assess whether to archive (superseded by system-audit-2026-03-31) or fold useful logic into the v2 script. No new development expected.

## Structure

- `briefs/` — empty.
- `decisions/` — empty.
- `docs/` — empty.
- `archive/` — empty.
- `scratch/` — empty.
- `scripts/` — the two analysis scripts.

## Key documents

- [`scripts/repair_profitability.py`](scripts/repair_profitability.py) — pulls repair data from Monday Main Board, calculates profitability (excludes BM).
- [`scripts/repair_deep_dive.py`](scripts/repair_deep_dive.py) — device × repair-type matrix from existing `repair-profitability.json`.

## Open questions

- Consolidate vs `system-audit-2026-03-31/repair_profitability_v2.py` (Phase 7c call).

# operations-system

**State:** active
**Owner:** operations
**Purpose:** Working project for rebuilding iCorrect's operating system from current-state truth capture through target-state design — the canonical home for verified domain process docs (intake, repair-queue, workshop, qc, logistics, parts, trade-ins).
**Last updated:** 2026-05-02 UTC

## Current state

### In flight
- Domain folder build-out under `docs/domains/` (idea-inventory ID `f5952975`).
- Workshop-handoff domain capture, resuming from last verified checkpoint (idea-inventory ID `b5d3ecd5`).
- `tools/repair-stock-check.js` and shared lib in `tools/lib/`.

### Recently shipped
- `docs/INDEX.md` (operational sub-index already present).
- `docs/process-document-structure-template.md` — canonical capture format for new process docs.
- `docs/team-ownership-map.md` — team ownership mapping.
- `docs/system-audit-2026-03-31-index.md` and `docs/system-audit-working-map.md` — audit consumption surface.
- `docs/ferrari-dependency-assessment-2026-04-24.md`.

### Next up
- Continue domain folder build-out per `docs/INDEX.md` plan.
- Verify draft SOPs against actual workflows before promotion to canon.

## Structure

- `briefs/` — empty (no proposals captured here yet; new briefs land here per folder-standard).
- `decisions/` — empty (decisions backfill deferred to Phase 7c).
- `docs/` — pre-existing. Has its own [`INDEX.md`](docs/INDEX.md). 8 root files + `domains/` (per-domain process truth) + `tools/` subdir.
- `archive/` — empty.
- `scratch/` — empty.
- `tools/` — pre-existing. `repair-stock-check.js` + `lib/` shared modules.
- `.claude/` and `.remember/` — Claude Code worktree/state (excluded from classification).

## Key documents

- [`README.md`](README.md) — master operational entry point.
- [`docs/INDEX.md`](docs/INDEX.md) — docs sub-index (pre-existing, authoritative for this folder).
- [`docs/process-document-structure-template.md`](docs/process-document-structure-template.md) — canonical capture format.
- [`docs/team-ownership-map.md`](docs/team-ownership-map.md) — team ownership map.
- [`docs/ops-data-source-index.md`](docs/ops-data-source-index.md) — ops data source index.
- [`docs/business-problem-frame.md`](docs/business-problem-frame.md) — business problem frame.
- [`docs/system-audit-2026-03-31-index.md`](docs/system-audit-2026-03-31-index.md) — audit pack index.
- [`docs/system-audit-working-map.md`](docs/system-audit-working-map.md) — audit working map.
- [`docs/ferrari-dependency-assessment-2026-04-24.md`](docs/ferrari-dependency-assessment-2026-04-24.md) — Ferrari dependency assessment.
- [`docs/domains/`](docs/domains/) — per-domain process truth folders.
- [`tools/repair-stock-check.js`](tools/repair-stock-check.js) — stock-check tool.

## Notes

- This folder follows a slightly different shape than the standard because `docs/` already has an authoritative INDEX from prior work. Phase 7a kept the existing docs structure intact (no top-level docs files moved); only added the missing `briefs/`, `decisions/`, `archive/`, `scratch/` skeleton.

# documentation

**State:** dormant (last activity: 2026-04-13)
**Owner:** none
**Purpose:** Documentation-build staging area with a progress tracker and raw imported domain docs (Claude.ai exports). Was supposed to support the documentation rebuild plan that fed agent CLAUDE.md reference paths.
**Last updated:** 2026-05-02

## Current state

Dormant. Last meaningful change: 2026-04-13 (intercom-finn.md, n8n-automations.md updates). Most other raw imports date 2026-02-23. Per `~/builds/INDEX.md`, this folder was the docs home before BM files were moved out — what remains is the unprocessed raw-imports backlog plus a stale progress tracker.

**Phase 7c review candidate:** assess whether to fold raw-imports into KB (`~/kb/`), revive the documentation rebuild, or archive entirely.

## Structure

- `briefs/` — empty.
- `decisions/` — empty.
- `docs/` — `raw-imports/` subdir with 10 exported domain docs (Claude.ai imports).
- `archive/` — empty.
- `scratch/` — `PROGRESS.md` (stale progress tracker from the original documentation build, working-notes content).

## Key documents

- [`scratch/PROGRESS.md`](scratch/PROGRESS.md) — original documentation build progress tracker (Feb 2026), now stale; classified as scratch per rubric (working-notes pattern).
- [`docs/raw-imports/`](docs/raw-imports/) — 10 raw domain docs:
  - `backmarket-trade-in-operations.md` — BM trade-in operations export
  - `finance-cashflow.md` — finance/cashflow export
  - `hr-team.md` — HR/team export
  - `intercom-finn.md` — Intercom + Finn AI export
  - `inventory-parts.md` — inventory/parts export
  - `monday-schema.md` — Monday board schema export
  - `n8n-automations.md` — n8n automations export
  - `shopify-website.md` — Shopify website export
  - `sops-operational-procedures.md` — SOP export
  - `strategic-planning.md` — strategic planning export

## Open questions

- Should `docs/raw-imports/` move into `~/kb/` so it's reachable as canonical reference, or stay parked here?
- Is the 9-doc verification backlog (logged in scratch/PROGRESS.md) still relevant or fully superseded by Phase 6.9 inventory work?

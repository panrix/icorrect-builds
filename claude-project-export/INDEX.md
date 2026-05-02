# claude-project-export

**State:** dormant (last activity: 2026-04-13)
**Owner:** operations
**Purpose:** Exported Claude project corpus covering SOPs, business context, KB schema rules, and customer-service reference. Snapshot of an upstream Claude project surface.
**Last updated:** 2026-05-02

## Current state

Dormant since 2026-04-13. Inventory tag: `snapshot-of-other` — content has been migrated into `~/kb/` and individual project folders. This folder remains as the canonical export snapshot it was generated from.

**Phase 7c review candidate:** assess whether to fully archive the snapshot (move whole folder under `~/archive/`), or keep as a reference index since multiple `idea-inventory.md` rows still cite paths inside `sop-project/`.

**Heads up:** `idea-inventory.md` references many files inside `sop-project/` directly (foundation-GOALS, foundation-PRINCIPLES, ops-sop-quoting-process, etc.) and `README.md`. The `sop-project/` directory has been left intact (no restructuring of subdirs per Phase 7a rules) so existing references continue to resolve.

## Structure

- `README.md` — kept at root (operational entry; referenced widely from idea-inventory)
- `briefs/` — empty
- `decisions/` — empty
- `docs/` — 6 reference docs moved from root + `audits/` (1 file). See [`docs/INDEX.md`](docs/INDEX.md).
- `archive/2026-04-07-export-snapshot/` — `ricky-systems-dump.md` (matches `*-dump` rule)
- `scratch/` — empty
- `sop-project/` — pre-existing subfolder with 118 SOP/foundation/KB markdown files. Left intact. See [`sop-project/INDEX.md`](sop-project/INDEX.md).

## Key documents

- [`README.md`](README.md) — original export README
- [`docs/COMPANY.md`](docs/COMPANY.md) — was at root
- [`docs/TEAM.md`](docs/TEAM.md) — was at root
- [`docs/SCHEMA.md`](docs/SCHEMA.md) — was at root
- [`docs/iphone.md`](docs/iphone.md), [`docs/macbook.md`](docs/macbook.md), [`docs/main-board.md`](docs/main-board.md) — device references (was at root)
- [`docs/audits/repair-history-analysis.md`](docs/audits/repair-history-analysis.md) — was at root (matches `*-analysis` rule)
- [`archive/2026-04-07-export-snapshot/ricky-systems-dump.md`](archive/2026-04-07-export-snapshot/ricky-systems-dump.md) — was at root (matches `*-dump` rule)
- [`sop-project/`](sop-project/) — 118 SOP/foundation/KB markdown files (alex-kb-*, bm-sop-*, ops-sop-*, foundation-*, monday-*, pricing-*, research-*, etc.)

## Open questions

- Phase 7c: archive the whole folder, or keep as a permanent corpus index?
- Many references in `~/builds/agent-rebuild/idea-inventory.md` point at `sop-project/` files. Path-patch sweep should leave these intact (no moves inside `sop-project/`).

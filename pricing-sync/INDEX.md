# pricing-sync

**State:** dormant (last activity: 2026-03-16, with light report-time touch 2026-03-31)
**Owner:** operations
**Purpose:** Cross-system pricing audit and sync project intended to use Shopify as source of truth and reconcile/update Monday boards (3923707691 Devices, 2477699024 Products & Pricing) and SumUp via 5-phase pipeline.
**Last updated:** 2026-05-02 08:30 UTC

## Current state

Dormant. Last meaningful run: 2026-03-16 (audit report + update log). Reason for dormancy: audit ran once, surfaced gaps, no follow-through to populate Shopify IDs on Monday or to create missing Monday items. A separate cron at `~/builds/alex-triage-rebuild/scripts/generate-pricing-kb.js` is currently broken (idea `4c831aaa`) and references this folder's data path indirectly via the wider pricing flow.

**Phase 7c review candidate:** decide whether to revive the 5-phase pipeline (operations agent owner) or archive once the alex-triage pricing-kb script is rebuilt.

## Structure

- `briefs/` — `plan.md` (5-phase build plan).
- `decisions/` — empty.
- `docs/` — `staged/2026-03-31/pricing-sync-brief.md` (older brief snapshot).
- `archive/` — empty.
- `scratch/` — empty.
- `config/` — alias maps (`name-aliases.json`, `repair-aliases.json`).
- `data/` — runtime data dumps (Shopify live, Monday devices/pricing schemas, SumUp parsed/corrected/fix CSVs, catalog-matched).
- `reports/` — dated audit + change reports.
- Top-level `phase1-pull.py`, `phase2-match.py`, `phase3-audit.py`, `phase4-monday-update.py`, `phase5-sumup-gen.py`, `utils.py` — pipeline code; left at root as a coherent code base.

## Key documents

- [`briefs/plan.md`](briefs/plan.md) — 5-phase build plan (Shopify pull → match → audit → Monday update → SumUp regen).
- [`docs/staged/2026-03-31/pricing-sync-brief.md`](docs/staged/2026-03-31/pricing-sync-brief.md) — earlier brief snapshot.
- [`reports/audit-2026-03-16.md`](reports/audit-2026-03-16.md) — audit run output.
- [`reports/sumup-changes-2026-03-16.md`](reports/sumup-changes-2026-03-16.md) — SumUp diff log.
- [`reports/unmatched-items-2026-03-16.md`](reports/unmatched-items-2026-03-16.md) — items unmatched between systems.
- [`data/monday-pricing.json`](data/monday-pricing.json) — referenced from `~/kb/pricing/` (macbook, ipad, watch, iphone).

## Inbound references

- `~/.openclaw/agents/operations/workspace/TOOLS.md:8` — lists folder as build-local spec home.
- `~/.openclaw/agents/operations/workspace/MEMORY.md:26` — lists folder.
- `~/kb/pricing/{macbook,ipad,watch,iphone}.md` — reference `data/monday-pricing.json`.
- `~/builds/agent-rebuild/idea-inventory.md` — references `reports/audit-2026-03-16.md` (ideas `e457f452`, `42fcc35c`, P3).

## Open questions

- Create the missing Monday items that exist in Shopify but not on the Monday pricing board (idea `e457f452`, P3).
- Populate Shopify IDs on matched Monday pricing items to anchor future syncs (idea `42fcc35c`, P3).
- Restore the missing `generate-pricing-kb.js` dependency expected by the pricing-sync cron (idea `4c831aaa`, P2 — note: lives in `alex-triage-rebuild`, related context).

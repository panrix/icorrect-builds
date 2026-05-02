# data

**State:** dormant (last activity: 2026-03-23)
**Owner:** backmarket
**Purpose:** Small ad hoc data drop holding a buyback profitability lookup and a manual buy-box check report for device listings. Inventory tag: `scratch`. Folder name is generic (`data`) and the contents are one-off output artifacts, not a structured data store.
**Last updated:** 2026-05-02 UTC (Phase 7a folder-standard rollout)

## Current state

Dormant. Last meaningful change: 2026-03-23. Reason for dormancy: scratch-flavored ad-hoc drop; superseded by `~/builds/backmarket/data/` and `~/builds/buyback-monitor/data/` for canonical data.

**Phase 7c review candidate:** confirm contents are no longer needed and either delete or move under `~/builds/backmarket/data/historical/` if still referenced for anything. Note: `~/builds/agent-rebuild/idea-inventory.md` lines 233 and 235 still reference `buy-box-check-2026-03-23.txt` (ideas `3801116f` and `2dcf2c58`).

## Structure

- `briefs/` — empty (gitkeep)
- `decisions/` — empty (gitkeep)
- `docs/` — empty (gitkeep)
- `archive/` — empty (gitkeep)
- `scratch/` — `buyback-profitability-lookup.json`, `buy-box-check-2026-03-23.txt` (moved from root: ad-hoc output artifacts, classified as scratch per rubric)

## Key documents

- [`scratch/buyback-profitability-lookup.json`](scratch/buyback-profitability-lookup.json) — moved from root (~324 KB lookup snapshot)
- [`scratch/buy-box-check-2026-03-23.txt`](scratch/buy-box-check-2026-03-23.txt) — moved from root (manual buy-box check report; cited in idea-inventory)

## Inbound references (paths changed)

- `~/builds/agent-rebuild/idea-inventory.md` lines 233, 235 reference `buy-box-check-2026-03-23.txt` — now at `scratch/buy-box-check-2026-03-23.txt`

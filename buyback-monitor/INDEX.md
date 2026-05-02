# buyback-monitor

**State:** active
**Owner:** backmarket
**Purpose:** Live buyback monitoring and price-management workspace for Back Market buyback listings, including sell-price scraping, bid/order analysis, profitability and grade diagnostics, and Monday/Sheets sync. Cron-driven daily and weekly runs.
**Last updated:** 2026-05-02 UTC (Phase 7a folder-standard rollout)

## Current state

### In flight
- Daily cron (`run-daily.sh` at 0 5 *) and weekly cron (`run-weekly.sh` at 0 5 * * 1) active
- `sync_tradein_orders.py` runs daily at 5:30
- Pipeline rewrite brief in `briefs/CODEX-V7-PIPELINE-REWRITE-BRIEF.md` (idea `30413128` in inventory)

### Recently shipped
- 2026-04-27: `pull_parts_data_v3.py` updated
- 2026-04-14: `analysis/`, `generate_sell_lookup.py`, `run_price_pipeline.py`, `sync_to_sheet.py` modernised
- 2026-04-04: changelog snapshot (now in archive/)

### Next up
- Idea `30413128`: rewrite the downstream pipeline to consume the v7 scraper contract natively (see brief)

## Structure

- `briefs/` — `CODEX-V7-PIPELINE-REWRITE-BRIEF.md` (moved from root)
- `decisions/` — empty (gitkeep)
- `docs/` — 9 files + `audits/` + `phase0/` — has own INDEX
- `archive/` — `CHANGELOG-2026-04-04.md` (moved from root) + `README.md` (pre-existing archive of prior README)
- `scratch/` — empty (gitkeep)
- `analysis/` — analysis outputs (kept as-is)
- `config/` — runtime config (kept as-is)
- `data/` — runtime data incl. `sell-prices-latest.json` referenced by backmarket workspace TOOLS.md (kept as-is)
- Code at root (>3 files = larger code base; per rubric, NOT moved): `bid_order_analysis.py`, `build_cost_matrix.py`, `buy_box_monitor.py`, `diagnose_grades.py`, `generate_sell_lookup.py`, `populate_tradein_grades.py`, `pull_parts_data_v3.py`, `run-daily.sh`, `run-weekly.sh`, `run_price_pipeline.py`, `sell_price_scraper_v7.js`, `sync_to_sheet.py`, `sync_tradein_orders.py`

## Key documents

- `README.md` — operational entry (kept at root)
- `package.json` / `package-lock.json` — manifest (kept at root)
- [`briefs/CODEX-V7-PIPELINE-REWRITE-BRIEF.md`](briefs/CODEX-V7-PIPELINE-REWRITE-BRIEF.md) — moved from root (rule: `*-BRIEF.md` → `briefs/`)
- [`archive/CHANGELOG-2026-04-04.md`](archive/CHANGELOG-2026-04-04.md) — moved from root (dated changelog snapshot, treated as historical)
- [`docs/INDEX.md`](docs/INDEX.md) — index of canonical docs

## Inbound references (preserved)

- Crontab: `0 5 * * 1 /home/ricky/builds/buyback-monitor/run-weekly.sh`, `0 5 * * * /home/ricky/builds/buyback-monitor/run-daily.sh`, `30 5 * * * /usr/bin/python3 /home/ricky/builds/buyback-monitor/sync_tradein_orders.py` — all root-level scripts unchanged
- `~/.openclaw/agents/main/workspace/MEMORY.md` line 34: references the folder generally — unchanged
- `~/.openclaw/agents/backmarket/workspace/TOOLS.md` line 21: `data/sell-prices-latest.json` — unchanged
- `~/kb/backmarket/product-id-resolution.md` line 10: `docs/BM-PRODUCT-PAGE-STRUCTURE.md` — unchanged (still in docs/ root)

## Inbound references (paths changed)

- `~/builds/agent-rebuild/idea-inventory.md` line 238 references `CODEX-V7-PIPELINE-REWRITE-BRIEF.md` — now at `briefs/CODEX-V7-PIPELINE-REWRITE-BRIEF.md`

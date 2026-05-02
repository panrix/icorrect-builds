# backmarket

**State:** active
**Owner:** backmarket
**Purpose:** Primary Back Market operations workspace for SOPs, listing and queue automation, webhook services, and operational data. Canonical home of the BM operating system.
**Last updated:** 2026-05-02 UTC (Phase 7a folder-standard rollout)

## Current state

### In flight
- Active daily — referenced by Hugo (backmarket agent) SOUL/CLAUDE/TOOLS as authoritative location for SOPs, scripts, data stores. Live cron entries run from `scripts/` (sent-orders, sale-detection, board-housekeeping, buy-box-check, morning-briefing, reconcile-listings).

### Recently shipped
- 2026-04-27: BM private API discovery committed (`api-specs/`, `api-docs/`)
- 2026-04-26: SOP 6 listing-create flow proven live; multiple Codex listing-card runs landed in `reports/`

### Next up
- See briefs/ once populated — per Phase 7a, new proposals land there

## Structure

- `briefs/` — empty (gitkeep) — new proposals/specs go here
- `decisions/` — empty (gitkeep) — append-only decision log going forward
- `docs/` — canonical reference (10 entries) — has own INDEX
- `archive/` — historical content (`CHANGELOG.md` moved here Phase 7a)
- `scratch/` — working scratch (`tmp-check-sent-order-aiidm.js`)
- `api-docs/` — Back Market private API docs (kept as-is)
- `api-specs/` — Back Market private API OpenAPI specs (kept as-is)
- `data/` — runtime data stores (listings-registry.json, bm-catalog.json, captures/) — kept as-is
- `knowledge/` — BM product/lookup knowledge files — kept as-is
- `pricing/` — parked pricing module — kept as-is
- `qa/` — QA issue tracker — kept as-is
- `reports/` — generated Codex reports/audits — kept as-is
- `scripts/` — canonical BM automation scripts (cron entrypoints) — kept as-is
- `services/` — bm-shipping, bm-payout, bm-grade-check (systemd units point here) — kept as-is
- `sops/` — 12 BM SOPs incl. master `00-BACK-MARKET-MASTER.md` — kept as-is
- `test/` — test fixtures/harness — kept as-is

## Key documents

- `README.md` — operational entry (kept at root)
- `package.json` / `package-lock.json` — manifest (kept at root)
- `.gitignore` — kept at root
- [`docs/INDEX.md`](docs/INDEX.md) — index of canonical docs
- [`archive/CHANGELOG.md`](archive/CHANGELOG.md) — moved from root (was a long-running CHANGELOG; treated as historical)
- [`docs/audits/OVERNIGHT-BACKMARKET-RECOVERY-2026-04-25.md`](docs/audits/OVERNIGHT-BACKMARKET-RECOVERY-2026-04-25.md) — overnight recovery report (moved from root)
- [`scratch/tmp-check-sent-order-aiidm.js`](scratch/tmp-check-sent-order-aiidm.js) — ad-hoc check script (moved from root, `tmp-` prefix)

## Inbound references (preserved by this rollout)

- Cron jobs in `crontab -l` reference `scripts/sent-orders.js`, `scripts/sale-detection.js`, `scripts/board-housekeeping.js`, `scripts/buy-box-check.js`, `scripts/morning-briefing.js`, `scripts/reconcile-listings.js` — unchanged
- Systemd units `bm-shipping.service`, `bm-payout.service`, `bm-grade-check.service` reference `services/bm-*` — unchanged
- backmarket workspace SOUL/CLAUDE/AGENTS/TOOLS/MEMORY reference `README.md`, `sops/`, `scripts/`, `data/listings-registry.json`, `data/bm-catalog.json` — all unchanged
- `kb/backmarket/`, `kb/operations/`, `kb/monday/`, `kb/customer-service/_draft/` reference `sops/`, `scripts/`, `services/`, `docs/VERIFIED-COLUMN-REFERENCE.md`, `data/product-id-lookup.json` — all unchanged

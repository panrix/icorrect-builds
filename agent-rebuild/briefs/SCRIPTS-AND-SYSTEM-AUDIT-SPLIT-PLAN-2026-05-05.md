# Scripts And System Audit Split Plan - 2026-05-05

## Purpose

Continue Phase 7b cleanup without touching active Back Market, Intake, or Inventory build lanes. This is an audit-first split plan only; no physical moves happen in this step.

## Root `scripts/` Finding

The root `scripts/` folder is small and dormant:

- size: about 52K
- files: 9 total, including standard empty folder markers
- active scripts: 3
- current `INDEX.md` already marks the folder dormant
- live reference check on 2026-05-05 found no cron/systemd callers for `/home/ricky/builds/scripts`

| Script | Runtime | Inputs/secrets | Current behavior | Recommended destination |
|---|---|---|---|---|
| `scripts/scripts/bm-price-history-load.py` | Python | `MONDAY_APP_TOKEN`, `BACKMARKET_API_AUTH`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, optional `SUPABASE_DB_URL` | Pulls sold Back Market items from Monday, enriches with BM API sale prices, normalizes canonical spec keys, inserts into Supabase. | Defer while Back Market active; later move to `backmarket/scripts/` or archive under `backmarket/archive/scripts/` after BM agent confirms overlap. |
| `scripts/scripts/monday-repair-flow-traces.py` | Python | `MONDAY_APP_TOKEN` | Pulls completed Main Board items, categorizes flow types, fetches activity logs, writes repair-flow trace output. | Move later to operations analytics/audit area, likely `operations-system` or `operations/scripts/`, after path update for its hard-coded output file. |
| `scripts/scripts/pdf-to-images.sh` | Bash | `pdftoppm`, `pdfinfo` | Converts PDF pages to PNG files under `/tmp/pdf-images/<basename>/` for agent viewing. | Move later to fleet utilities, likely `fleet/scripts/pdf-to-images.sh`; safe utility with no business-domain ownership. |

## Root `scripts/` Split Sequence

1. Ask the Back Market agent whether `bm-price-history-load.py` is superseded by current BM pricing/listing scripts.
2. If still useful, move it into the Back Market lane after BM active work lands. If superseded, archive it under Back Market with a short retirement note.
3. Move `monday-repair-flow-traces.py` into an operations analytics/script area and patch the hard-coded output path.
4. Move `pdf-to-images.sh` into fleet utilities.
5. Replace root `scripts/` with a pointer README or remove it from parent source after all three scripts have landed elsewhere.

Do not move the root `scripts/` folder as a single unit.

## `system-audit-2026-03-31` Finding

The system audit folder is larger and already internally domain-organized:

- size: about 6.0M
- files: 133
- audit scripts: 14 Python scripts under `scripts/`
- research docs by domain:
  - cross-domain: 10
  - customer-service: 5
  - finance: 4
  - marketing: 7
  - operations: 10
  - parts: 4
  - systems: 6
  - team: 3

The folder should be treated as a frozen source pack first, then extracted from. Do not edit or partially move its internal source pack in place.

**2026-05-05 read-only audit update:** no cron/systemd callers were found, but many KB files still cite `/home/ricky/builds/system-audit-2026-03-31/...` directly. A physical move must wait for a source-reference update batch.

## System Audit Extraction Map

| Source area | Destination after extraction | Notes |
|---|---|---|
| `research/customer-service/` | `customer-service/docs/audits/` | Customer identity, retention, Intercom metrics. |
| `research/finance/` | `finance/docs/audits/` | Financial mapping, Xero/Monday reconciliation, payment truth. |
| `research/marketing/` | `marketing/docs/audits/` | GA4/PostHog, GSC, Shopify health, marketing blockers. |
| `research/operations/` | `operations/docs/audits/` | Monday data quality, SOP coverage, timing, capacity, handoff failures. |
| `research/parts/` | Inventory lane after active work lands | Parts/supplier analysis should wait for the inventory agent and `panrix/icorrect-parts-service` branch `codex/inventory-system`. |
| `research/systems/` | `fleet/docs/audits/` or `fleet/system-audit-2026-03-31/` | Architecture, access matrix, data flows, integration catalog, n8n audit. |
| `research/team/` | `team/docs/audits/` | Staff performance and team operations. |
| `client_journeys/` | `operations/docs/client-journeys/` plus customer-service references | Journey docs cut across operations and CS; keep canonical copy under operations unless Ricky decides otherwise. |
| `platform_inventory/` | `fleet/platform-inventory/` | Cross-platform inventory belongs in fleet, with domain references out to owners. |
| `scripts/` | Archive with frozen pack first; re-run only from a new audited scripts area | Many scripts read `/home/ricky/config/api-keys/.env` and write hard-coded `/home/ricky/builds/system-audit-2026-03-31` outputs. |

## System Audit Split Sequence

1. Choose and document the frozen destination, likely `fleet/system-audit-2026-03-31`.
2. Update KB `source:` lists and markdown links that currently point at `/home/ricky/builds/system-audit-2026-03-31/...`.
3. Preserve the original folder as frozen source under the chosen fleet destination.
4. Create domain extraction folders with `INDEX.md` files.
5. Copy domain docs into their destination areas with source links back to the frozen pack.
6. Do not re-run audit scripts during the move; they are historical capture scripts with hard-coded paths and API credentials.
7. After extraction, replace the old root folder with a pointer README or remove it from the parent repo in a dedicated PR.

## Active Lane Constraints

Do not extract into or move files under:

- Back Market active paths
- Intake active paths
- Inventory active paths

For Inventory/parts material, wait until the inventory agent has folded useful research into `panrix/icorrect-parts-service` and pushed `codex/inventory-system`.

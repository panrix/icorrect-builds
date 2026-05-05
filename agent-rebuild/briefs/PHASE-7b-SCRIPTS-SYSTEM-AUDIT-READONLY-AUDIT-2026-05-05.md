# Phase 7b Scripts And System Audit Read-Only Audit - 2026-05-05

## Status

Read-only audit complete. No physical moves were made.

## Scope

- `~/builds/scripts`
- `~/builds/system-audit-2026-03-31`

No Back Market, Intake, Inventory, Shopify, cron, systemd, OpenClaw config, or live runtime paths were changed.

## Live Reference Check

No direct references to `/home/ricky/builds/scripts` or `/home/ricky/builds/system-audit-2026-03-31` were found in:

- live user crontab
- user systemd unit files
- root systemd unit files

This means neither folder appears to be a live scheduled/runtime entrypoint.

## Root `scripts` Finding

The root `scripts` folder is small and should be split script-by-script, not moved as one folder.

| Script | Owner | Finding | Recommendation |
|---|---|---|---|
| `scripts/scripts/bm-price-history-load.py` | Back Market | Pulls sold BM items from Monday, enriches through Back Market API, writes Supabase price history. Uses `MONDAY_APP_TOKEN`, `BACKMARKET_API_AUTH`, and Supabase service credentials. | Defer while Back Market is active. Ask BM agent whether current BM pricing/listing work supersedes it; move or archive under Back Market later. |
| `scripts/scripts/monday-repair-flow-traces.py` | Operations | Pulls Monday Main Board repair flow traces and writes a hard-coded output to `/home/ricky/builds/documentation/monday/repair-flow-traces.md`. | Move later to operations analytics/scripts only after patching its output path. |
| `scripts/scripts/pdf-to-images.sh` | Fleet utility | Generic PDF to PNG helper using `pdfinfo` and `pdftoppm`, outputting to `/tmp/pdf-images/<basename>/`. | Move later to fleet scripts/utilities. |

## System Audit Finding

`system-audit-2026-03-31` is a frozen research pack, not a current build lane.

It is already internally domain-organized:

- `research/customer-service`
- `research/finance`
- `research/marketing`
- `research/operations`
- `research/parts`
- `research/systems`
- `research/team`
- `research/cross-domain`
- `client_journeys`
- `platform_inventory`
- `scripts`

The folder has 142 tracked files in the parent repo. The 14 tracked Python scripts are research/audit capture scripts with hard-coded `/home/ricky/builds/system-audit-2026-03-31` output paths and direct API credential use from `/home/ricky/config/api-keys/.env`.

## Hard Reference Blocker

Do not physically move `system-audit-2026-03-31` yet.

The KB still treats the current path as canonical:

- `/home/ricky/kb/SCHEMA.md` names `/home/ricky/builds/system-audit-2026-03-31/research/` as a canonical source path.
- KB pages in finance, parts, marketing, and customer-service cite specific files under the current path.
- Draft KB workflow maps also cite `client_journeys/` and `research/operations/` under the current path.

Moving the folder before a reference-update batch would break agent/source lookups.

## Recommended Next Moves

1. Keep `system-audit-2026-03-31` in place for now.
2. Create a dedicated Phase 7c source-reference update batch:
   - choose frozen destination, likely `~/fleet/system-audit-2026-03-31`
   - update KB `source:` lists and markdown links
   - add a pointer/index at the old path only if needed during transition
3. Extract domain summaries after the source pack is preserved:
   - finance docs into `~/finance/docs/audits`
   - marketing docs into `~/marketing/docs/audits`
   - operations docs into `~/operations/docs/audits`
   - customer-service docs into `~/customer-service/docs/audits`
   - team docs into `~/team/docs/audits`
   - systems/platform inventory into `~/fleet`
   - parts material after the Inventory lane is quiet
4. Do not run or promote the 14 audit scripts until they get a separate verification pass.

## Decision

This pass closes the question of whether `scripts` and `system-audit-2026-03-31` can be moved blind: they cannot.

The safe next action is reference-aware extraction, not a folder rename.

# Phase 7b Batch 2 Repair Analysis Archive Report - 2026-05-05

## Status

Physical archive move complete; parent repo cleanup PR created.

## Scope

`~/builds/repair-analysis` -> `~/fleet/archive/repair-analysis-2026-05`

No Back Market, Intake, Inventory, Shopify, cron, systemd, or live service paths were changed.

## Reason

`repair-analysis` is a dormant scratch folder with two standalone Python scripts for repair profitability analysis. The scripts use hardcoded local paths and Monday board IDs, have no wrapper or tests, and no live caller was found.

The March 2026 system audit pack already contains the newer repair profitability work, including:

- `~/builds/system-audit-2026-03-31/scripts/repair_profitability_v2.py`
- `~/builds/system-audit-2026-03-31/docs/audits/repair-profitability-v2.md`

Archiving is safer than promoting this folder to `~/workshop/repair-analysis` because it preserves the old scripts without turning them into a current source of truth.

## Moved Files

| New path | Purpose |
|---|---|
| `~/fleet/archive/repair-analysis-2026-05/INDEX.md` | Archive index and move note |
| `~/fleet/archive/repair-analysis-2026-05/scripts/repair_profitability.py` | Old Monday repair profitability script |
| `~/fleet/archive/repair-analysis-2026-05/scripts/repair_deep_dive.py` | Old repair deep-dive script that reads generated profitability JSON |
| `~/fleet/archive/repair-analysis-2026-05/{archive,briefs,decisions,docs,scratch}/.gitkeep` | Preserved standard folder placeholders |

## Live Reference Check

No references were found in:

- live user crontab
- user systemd unit files
- root systemd unit files

## Verification

- Local source removed: `/Users/ricky/vps/builds/repair-analysis` no longer exists.
- Live VPS source removed: `/home/ricky/builds/repair-analysis` no longer exists.
- Local destination exists under `/Users/ricky/vps/fleet/archive/repair-analysis-2026-05`.
- Live VPS destination exists under `/home/ricky/fleet/archive/repair-analysis-2026-05`.
- Script checksums matched local and live VPS:

| File | SHA-256 |
|---|---|
| `scripts/repair_profitability.py` | `753990b1c0b16b1ead864d50a67f72ccd68e85197346f8e3cf2e0c057cae44a9` |
| `scripts/repair_deep_dive.py` | `97fa3d304bc811deede584f53baafe211ab118cf090629113bd5c974f0c76397` |

## GitHub Cleanup

The parent `panrix/icorrect-builds` repo now removes the old tracked `repair-analysis/` files, matching the physical archive destination.

## Follow-up

If repair profitability work becomes active again, rebuild the working surface from the newer `system-audit-2026-03-31` v2 script and keep this archive read-only as provenance.

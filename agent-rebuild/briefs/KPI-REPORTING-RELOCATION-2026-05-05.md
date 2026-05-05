# KPI Reporting Relocation - 2026-05-05

## Purpose

Record the physical VPS relocation of the weekly KPI Google Sheets updater out of the retired `mission-control-v2` tree.

## Decision

Ricky approved moving the KPI script to:

`/home/ricky/operations/finance/kpi-reporting`

This keeps the automation with operations-owned finance reporting instead of hiding it under the deprecated Mission Control v2 structure.

## Moved Source

| Old path | New path | Notes |
|---|---|---|
| `/home/ricky/mission-control-v2/scripts/kpi/kpi_updater.py` | `/home/ricky/operations/finance/kpi-reporting/scripts/kpi_updater.py` | Google Sheets KPI updater source |
| `/home/ricky/mission-control-v2/scripts/kpi/kpi_wrapper.sh` | `/home/ricky/operations/finance/kpi-reporting/scripts/kpi_wrapper.sh` | Wrapper updated to use the new base path |
| `/home/ricky/mission-control-v2/scripts/kpi/README.md` | `/home/ricky/operations/finance/kpi-reporting/README.md` | README now documents the move and inactive cron state |
| `/home/ricky/mission-control-v2/logs/kpi_updater.log` | `/home/ricky/operations/finance/kpi-reporting/logs/kpi_updater.log` | Historical log preserved on the live VPS |

The old script folder now only contains:

`/home/ricky/mission-control-v2/scripts/kpi/MOVED.md`

## Verification

- Local mirror path exists under `/Users/ricky/vps/operations/finance/kpi-reporting`.
- Live VPS path exists under `/home/ricky/operations/finance/kpi-reporting`.
- `kpi_wrapper.sh` passes shell syntax check.
- `kpi_updater.py` passes Python compile check.
- Generated `__pycache__` files were removed after verification.
- `vps-core` Mutagen session remained connected and watching after the move.

## Cron State

The live VPS crontab did not contain an active KPI wrapper entry when checked on 2026-05-05.

Do not re-enable this job until the KPI updater is reviewed, because the preserved historical log showed the last known run failed on 2026-03-29 against a Google Sheets range request.

## Follow-up

Before recommissioning:

1. Run `kpi_updater.py --dry-run` from `/home/ricky/operations/finance/kpi-reporting/scripts`.
2. Confirm the target Google Sheet tab/range still matches the script constants.
3. Confirm Xero, Monday, Shopify, and Back Market credentials are current.
4. Add a new cron entry only after a dry run succeeds.

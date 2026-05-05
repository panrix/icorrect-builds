# Live Cron Source Truth - 2026-05-05

## Purpose

Record the live VPS user crontab after the first Phase 7b cleanup moves.

This is a source-of-truth guardrail for future folder moves: any folder with a live cron entry must not be moved until the cron path, logs, service health, and rollback path are handled in the same batch.

## Key Findings

- The KPI Google Sheets updater is **not** currently scheduled in the live crontab.
- Most active scheduled work still points at `/home/ricky/builds/...`.
- Back Market and Royal Mail paths are live and must stay frozen while their active agents are working.
- The crontab contains several blank/comment-only legacy sections; these are not harmful, but they make it harder to see what is live.
- The old April cron audit is now stale; use this dated file when planning Phase 7b moves.

## Active Cron Entries

| Schedule | Path / command | Domain | Move risk |
|---|---|---|---|
| Every 15 min | `/home/ricky/.openclaw/scripts/health-check.sh` | Fleet/OpenClaw | Do not move without OpenClaw health check verification. |
| Daily 04:00 UTC | `find /tmp/openclaw -name '*.log' ... gzip` | Fleet/OpenClaw | Runtime cleanup; no repo move needed. |
| Daily 04:00 UTC | `find /tmp/openclaw -name '*.log.gz' ... -delete` | Fleet/OpenClaw | Runtime cleanup; no repo move needed. |
| Every 15 min | `/home/ricky/.openclaw/scripts/chrome-reaper.sh` | Fleet/OpenClaw | Do not move without process-leak verification. |
| Every 3 days at 21:00 UTC | `/home/ricky/config/xero_keepalive.sh` | Finance/Xero | Config-owned; keep outside repo. |
| Mondays 06:00 UTC | `/home/ricky/.openclaw/agents/parts/workspace/scripts/update_usage_columns.py` | Inventory/Parts | Active Inventory lane; do not move now. |
| Mondays 05:00 UTC | `/home/ricky/builds/buyback-monitor/run-weekly.sh` | Back Market | Frozen while BM work is active. |
| Daily 06:00 UTC | `/home/ricky/builds/backmarket/scripts/sent-orders.js --live` | Back Market | Frozen while BM work is active. |
| Weekdays hourly 07-17 UTC | `/home/ricky/builds/backmarket/scripts/sale-detection.js` | Back Market | Frozen while BM work is active. |
| Weekends 08/12/16 UTC | `/home/ricky/builds/backmarket/scripts/sale-detection.js` | Back Market | Frozen while BM work is active. |
| Weekdays 07:00 UTC | `/home/ricky/builds/royal-mail-automation/dispatch.js` | Operations/Royal Mail | Live path; repo already moved under `~/operations`, cron still points to old `~/builds` clone. |
| Weekdays 12:00 UTC | `/home/ricky/builds/royal-mail-automation/dispatch.js` | Operations/Royal Mail | Live path; needs dedicated cron-path migration. |
| Weekdays 07:30 UTC | `/home/ricky/builds/backmarket/scripts/board-housekeeping.js` | Back Market | Frozen while BM work is active. |
| Daily 05:00 UTC | `/home/ricky/builds/buyback-monitor/run-daily.sh` | Back Market | Frozen while BM work is active. |
| Daily 05:00 UTC | `/home/ricky/builds/alex-triage-rebuild/scripts/shopify-pricing.js` then `generate-pricing-kb.js` | Customer Service / Alex pricing | Defer until Alex conflict is resolved. |
| Sundays 07:30 UTC | `/home/ricky/builds/alex-triage-rebuild/scripts/learning-run.js` | Customer Service / Alex learning | Defer until Alex conflict is resolved. |
| Every 45 min | `/home/ricky/config/api-keys/refresh-searchable-mcp.sh` | Fleet/Auth | Config-owned; keep outside repo. |
| Daily 05:30 UTC | `/home/ricky/builds/buyback-monitor/sync_tradein_orders.py` | Back Market | Frozen while BM work is active. |
| Weekdays 06:30 UTC | `/home/ricky/builds/backmarket/scripts/buy-box-check.js` | Back Market | Frozen while BM work is active. |
| Weekdays 08:00 UTC | `/home/ricky/builds/backmarket/scripts/morning-briefing.js` | Back Market | Frozen while BM work is active. |
| Sundays 04:00 UTC | `/home/ricky/builds/backmarket/scripts/reconcile-listings.js --dry-run` | Back Market | Frozen while BM work is active. |
| Every 30 min | `/home/ricky/config/gsc_keepalive.sh` | Marketing/Google Search Console | Config-owned; keep outside repo. |
| Weekdays 12:00 UTC | `/home/ricky/builds/royal-mail-automation/repairs-dispatch.js` | Operations/Royal Mail | Live path; needs dedicated cron-path migration. |
| Weekdays 15:00 UTC | `/home/ricky/builds/royal-mail-automation/repairs-dispatch.js` | Operations/Royal Mail | Live path; needs dedicated cron-path migration. |
| Daily 02:15 UTC | `/home/ricky/builds/backmarket/scripts/build-sold-price-lookup.js --live` | Back Market | Frozen while BM work is active. |
| Daily 08:01 UTC | `/home/ricky/builds/backmarket/scripts/trade-ins-daily-brief.js` | Back Market | Frozen while BM work is active. |

## Comment-Only / Empty Sections

The live crontab still has comment headers without corresponding jobs:

- `Sync Claude CLI OAuth token to OpenClaw - every 15 minutes`
- `Alex Triage Rebuild cron schedule`
- `Morning full pull at 06:45 UTC`
- `Incremental checks every 15 minutes during working hours, Monday-Friday`

These should be cleaned in a later crontab tidy batch, after active jobs are backed up.

## KPI Reporting Status

The KPI updater now lives at:

`/home/ricky/operations/finance/kpi-reporting`

No KPI cron entry was found on 2026-05-05. Do not add one until the KPI dry run succeeds against the current Google Sheet.

## Cleanup Implications

### Safe to continue as docs-only

- Documentation ledgers.
- Destination maps.
- Conflict inventories.
- Service-path plans.

### Not safe to physically move yet

- `backmarket`
- `buyback-monitor`
- `royal-mail-automation`
- `alex-triage-rebuild`
- OpenClaw runtime scripts under `~/.openclaw`
- Config token scripts under `~/config`

### Next Recommended Path Batch

The first live-path migration should be Royal Mail, because the canonical repo has already been moved to:

`/home/ricky/operations/royal-mail-automation`

But cron still runs:

`/home/ricky/builds/royal-mail-automation`

That migration should be its own batch with:

1. Backup current crontab.
2. Confirm `/home/ricky/operations/royal-mail-automation` is clean and runnable.
3. Patch the four Royal Mail cron paths.
4. Run syntax/entry-point checks for `dispatch.js` and `repairs-dispatch.js`.
5. Keep the old builds clone in place until the next successful scheduled run.

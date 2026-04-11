# QA SOP/Script Audit — 2026-04-01

## Scope

Audit the canonical Back Market operating layer:

- `/home/ricky/builds/backmarket/sops/`
- `/home/ricky/builds/backmarket/scripts/`
- `/home/ricky/builds/backmarket/services/`
- live crontab and live user services

## Verified Runtime Facts

- `sale-detection.js` is live on crontab:
  - `0 7-17 * * 1-5`
  - `0 8,12,16 * * 6,0`
- `dispatch.js` is live on crontab:
  - `0 7 * * 1-5`
  - `0 12 * * 1-5`
- `reconcile-listings.js` has no live crontab entry.
- `buy-box-check.js` has no live crontab entry.
- `icloud-checker.service`, `bm-grade-check.service`, `bm-payout.service`, and `bm-shipping.service` are active.
- Monday `0 5 * * 1` cron runs `/home/ricky/builds/buyback-monitor/run-weekly.sh`.
- `run-weekly.sh` executes the Python `buy_box_monitor.py` pipeline, not `backmarket/scripts/buy-box-check.js`.

## Findings

### 1. Scheduler drift in SOP 08 and SOP 09

The docs still described the March 28 scheduler state rather than the current live crontab.

Affected:

- `sops/08-sale-detection.md`
- `sops/09-shipping.md`
- `sops/00-BACK-MARKET-MASTER.md`
- `README.md`

Fix:

- Updated these docs to match the live 2026-04-01 crontab.

### 2. SOP 07 trigger drift

SOP 07 said it ran on the Monday `run-weekly.sh` cron, but the live weekly cron actually runs the older Python `buy_box_monitor.py` buyback pipeline.

Affected:

- `sops/07-buy-box-management.md`
- `sops/00-BACK-MARKET-MASTER.md`
- `README.md`

Fix:

- Updated SOP 07 to state that `buy-box-check.js` currently has no live cron entry.
- Clarified that `run-weekly.sh` is not the active scheduler for the sell-side SOP 07 script.

### 3. SOP 06.5 trigger drift

SOP 6.5 presented reconciliation as a daily cron step even though no live scheduler is installed for `reconcile-listings.js`.

Affected:

- `sops/06.5-listings-reconciliation.md`
- `README.md`
- `sops/00-BACK-MARKET-MASTER.md`

Fix:

- Updated the trigger wording to on-demand + intended run order, instead of claiming an active live cron.

### 4. SOP 07 CLI drift

SOP 07 still claimed there was no explicit `--dry-run` flag. The live script supports `--dry-run`.

Affected:

- `sops/07-buy-box-management.md`

Fix:

- Updated QA notes and remaining-gap wording to reflect the actual CLI surface.

## Result

The main BM SOP set now matches the current live scheduler state more closely.

The remaining architectural issue is real and unresolved:

- the sell-side SOP 07 script (`backmarket/scripts/buy-box-check.js`) is documented as canonical, but it is not currently the thing running on the Monday 05:00 cron.
- the live weekly cron still runs `buyback-monitor/run-weekly.sh`, which executes the older Python `buy_box_monitor.py` pipeline.

That should be treated as the next BM operating-model decision:

1. either promote `buy-box-check.js` into the live scheduled path
2. or document the Python buyback monitor as the still-live scheduled system and stop implying SOP 07 is already scheduled

# Current Queue Pull Plan - 2026-04-25

## Scope

Define the safe path to get a current Back Market To List / clearance-first queue without performing live Back Market, Monday, customer, listing, return, warranty, or bulk mutations.

No live API call or mutation was performed while writing this plan.

## Goal

Produce a current queue artifact with enough evidence to split items into:

- `SAFE_TO_LIST`
- `CLEARANCE_LIST`
- `BLOCKED`

The artifact must be read-only and must not send Telegram/Slack/customer notifications.

## Required read-only data

Main Board `349212843`:

- item id
- item name
- group
- listing queue/status value
- BM Devices relation linked ids
- final grade
- colour
- parts cost
- labour hours/cost

BM Devices board `3892194968`:

- BM Devices item id
- name
- Main Board back-link
- listing id
- uuid
- SKU
- device/model lookup
- RAM
- SSD
- CPU
- GPU
- purchase/fixed cost
- current listing/linked state

Back Market API, if used read-only:

- listing id
- product_id
- SKU
- title/spec tuple
- quantity
- publication state
- price/min price

## Safe execution rules

- Run in explicit `--dry-run` or `--read-only` mode only.
- Disable notification sends where scripts support it.
- Do not run scripts that write Telegram summaries as part of read-only discovery unless patched or wrapped to suppress sends.
- Output only to `/home/ricky/builds/backmarket/reports/` or `/home/ricky/builds/backmarket/data/reports/`.
- Any script that writes cache/report files is acceptable only if it does not mutate Monday/BM/customer state and does not send messages.
- If a script cannot prove no external mutations/notifications, stop and patch a read-only/no-notify flag first.

## Candidate scripts to inspect before execution

- `/home/ricky/builds/backmarket/scripts/list-device.js`
- `/home/ricky/builds/backmarket/scripts/reconcile-listings.js`
- `/home/ricky/builds/backmarket/scripts/stuck-inventory-audit.js`
- `/home/ricky/builds/backmarket/scripts/build-sold-price-lookup.js`

## Proposed command shape

Only after inspection confirms no mutation/notification path:

```bash
cd /home/ricky/builds/backmarket
node scripts/list-device.js --dry-run --read-only --no-notify > reports/current-queue-raw-YYYY-MM-DD.json
```

If `--no-notify` or equivalent does not exist, add it before running.

## Output schema

Each row should include:

```json
{
  "classification": "SAFE_TO_LIST | CLEARANCE_LIST | BLOCKED",
  "main_item_id": "",
  "item_name": "",
  "bm_device_id": "",
  "listing_id": "",
  "uuid": "",
  "sku_current": "",
  "sku_expected": "",
  "product_id": "",
  "appearance": "",
  "quantity": null,
  "publication_state": null,
  "commercial_gate": "pass | fail | unknown",
  "clearance_reason": "",
  "block_reason": "",
  "evidence": []
}
```

## Current known repo-backed starting point

From `/home/ricky/builds/backmarket/reports/overnight-listing-clearance-map-2026-04-25.md`:

- BM 1555 / Main item `11522195767` is repo-confirmed as a clearance candidate.
- The full current live queue is not yet proven.

## Next action

Inspect candidate scripts for mutation/notification behavior and add a safe no-notify/read-only wrapper if needed before any live pull.

# Queue Script Safety Audit - 2026-04-25

## Scope

Inspected candidate Back Market queue/reconciliation scripts for mutation and notification risk before any current queue pull.

No live Back Market, Monday, Telegram, Slack, customer, return, warranty, mailbox, or browser action was performed.

## Scripts inspected

- `/home/ricky/builds/backmarket/scripts/list-device.js`
- `/home/ricky/builds/backmarket/scripts/reconcile-listings.js`
- `/home/ricky/builds/backmarket/scripts/stuck-inventory-audit.js`
- `/home/ricky/builds/backmarket/scripts/build-sold-price-lookup.js`

## Findings

### `list-device.js`

Default mode is dry-run and live mode requires `--live`. Mass live listing is blocked unless `--item` is supplied.

Risk notes:

- dry-run still performs live read calls to Monday/BM/scraper sources
- disk cache writes may occur via `writeDiskCache`
- live/probe paths contain BM `POST`, Monday mutations, and Telegram notifications
- not suitable as the first current queue pull until wrapped or run with carefully chosen dry-run/json flags and no notification path confirmed

### `reconcile-listings.js`

Default mode is dry-run and mutation execution is gated behind `--live` via `maybeMutate()`.

Risk notes:

- dry-run still performs live read calls to Monday and BM
- dry-run still calls `postTelegram()` unconditionally at report time
- therefore it is **not safe for quiet current queue discovery** without adding a `--no-notify` flag or wrapper first

### `stuck-inventory-audit.js`

Has `--dry-run`; `postTelegram()` returns early in dry-run.

Risk notes:

- still performs live Monday reads
- likely writes CSV/report artifacts
- safer than reconciliation for notification risk, but still needs output-path and mutation review before use as queue source

### `build-sold-price-lookup.js`

Has `--dry-run`; dry-run fetches completed BM orders but does not write `sold-prices-latest.json`.

Risk notes:

- read-only Back Market API calls
- not a To List queue source by itself
- useful for pricing evidence only

## Recommendation

Safest next implementation path:

1. Do not run `reconcile-listings.js` yet because dry-run sends Telegram.
2. Add `--no-notify` to `reconcile-listings.js` before using it for quiet discovery.
3. Prefer a new narrow queue script that only reads Monday Main Board + BM Devices queue fields and writes a JSON report; avoid BM listing changes, Telegram, Slack, or Monday mutations entirely.
4. Use BM API listing reads only after queue rows are identified and only for exact listing/product verification.

## Next

Patch or create a narrow `scripts/current-queue-readonly.js` with:

- explicit `--dry-run` / `--read-only`
- no Telegram/Slack
- JSON output only
- no Monday mutations
- no BM `POST`/`PUT`/`PATCH`/`DELETE`
- clear classification fields for `SAFE_TO_LIST`, `CLEARANCE_LIST`, `BLOCKED`

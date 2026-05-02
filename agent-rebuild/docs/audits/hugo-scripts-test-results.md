# Hugo Unscheduled Scripts — Dry Run Test

Test date: 2026-04-06 UTC

Env was sourced from `/home/ricky/config/api-keys/.env` before each run.

Safety handling:
- [`reconcile-listings.js`](/home/ricky/builds/backmarket/scripts/reconcile-listings.js#L1) has no dry-run or read-only flag. To stay inside the brief, it was executed with a temporary read-only guard that allowed BM and Monday reads but blocked Monday mutations, BM POSTs, Telegram sends, and the local JSON report write path.

## 1. `reconcile-listings.js`

Script:
- [`reconcile-listings.js`](/home/ricky/builds/backmarket/scripts/reconcile-listings.js#L1)

Run:
- `node /home/ricky/builds/backmarket/scripts/reconcile-listings.js`
- Guarded with `NODE_OPTIONS='--require /tmp/c06-readonly-guard.js'`

Exit:
- `1`

Env vars needed from code:
- `BACKMARKET_API_AUTH`
- `BACKMARKET_API_LANG` (optional in code, defaults to `en-gb`)
- `BACKMARKET_API_UA`
- `MONDAY_APP_TOKEN`
- `TELEGRAM_BOT_TOKEN`

Observed output:
- Loaded `15` Monday items with status `Listed`.
- Loaded `948` BM listings, `9` active.
- Loaded `1345` BM Device items.
- Reached cross-reference step and verified several active listings successfully.
- Flagged `2` Monday items whose stored listing IDs were not found on BM.
- Flagged `1` listed Monday item with no BM Device entry.
- Hit a missing-cost case and immediately attempted to write a backfilled cost to Monday.

Observed error:

```text
[READONLY BLOCK] Blocked Monday mutation: mutation { change_column_value(board_id: 3892194968, item_id: 11358388375, column_id: "numeric_mm1mgcgn", value: "444")
ReadOnlyBlocked: Blocked Monday mutation: mutation { change_column_value(board_id: 3892194968, item_id: 11358388375, column_id: "numeric_mm1mgcgn", value: "444")
```

Code paths that make it unsafe without a guard:
- Auto-backfills cost data to Monday in [`reconcile-listings.js`](/home/ricky/builds/backmarket/scripts/reconcile-listings.js#L252).
- Auto-offlines BM listings in [`reconcile-listings.js`](/home/ricky/builds/backmarket/scripts/reconcile-listings.js#L354).
- Sends Telegram output in [`reconcile-listings.js`](/home/ricky/builds/backmarket/scripts/reconcile-listings.js#L461).
- Writes a local JSON report in [`reconcile-listings.js`](/home/ricky/builds/backmarket/scripts/reconcile-listings.js#L483).

Crontab readiness:
- Not ready.
- It cannot be safely scheduled as-is because the analysis path mutates Monday before it finishes the check loop.
- It needs a real `--dry-run` or explicit action gating around all Monday mutations, BM offlines, Telegram sending, and local report writes.

## 2. `buy-box-check.js`

Script:
- [`buy-box-check.js`](/home/ricky/builds/backmarket/scripts/buy-box-check.js#L1)

Run:
- `node /home/ricky/builds/backmarket/scripts/buy-box-check.js --dry-run --no-scrape`

Exit:
- `0`

Env vars needed from code:
- `BACKMARKET_API_AUTH`
- `BACKMARKET_API_LANG` (optional in code, defaults to `en-gb`)
- `BACKMARKET_API_UA`
- `MONDAY_APP_TOKEN`
- `TELEGRAM_BOT_TOKEN` for normal runs

Other runtime dependencies observed:
- Resolver registry at `/home/ricky/builds/backmarket/data/listings-registry.json`
- Optional profitability lookup at `/home/ricky/builds/backmarket/data/buyback-profitability-lookup.json`
- Cached grade-price data at `/home/ricky/builds/buyback-monitor/data/sell-prices-latest.json`
- Browser/scraper path in [`buy-box-check.js`](/home/ricky/builds/backmarket/scripts/buy-box-check.js#L968) if `--no-scrape` is not used

Observed output:
- Found `9` active listings.
- Loaded resolver registry with `264` slots.
- Logged `No profitability lookup found — using Monday cost data only`.
- Summary `Winning: 6`, `Losing: 3`, `Variant mismatch: 1`, `Variant alerts: 6`, `Grade inversions: 3`, `Missing cost: 1`, `API errors: 0`
- In dry-run it correctly reported `WOULD AUTO-OFFLINE` for one resolver mismatch instead of mutating BM.
- It still wrote a local text report to `/home/ricky/builds/backmarket/data/buy-box-check-2026-04-06.txt` even in dry-run.

Representative output:

```text
⚠️ Not winning: MBA.A2681.8GB.256GB.Midnight.Good
BM#: 5995471 | Listed: 1 days
Our price: £630 | Buy box: £550
Net@win: £254.65 (47.69%) | Net@current: £311.85 (50.96%)
Action: Bump eligible (30%+ tier) — flagged for review
⛔ VARIANT MISMATCH ... → WOULD AUTO-OFFLINE
```

Code paths that would mutate in non-dry-run mode:
- Monday cost correction when `--recalc` is used in [`buy-box-check.js`](/home/ricky/builds/backmarket/scripts/buy-box-check.js#L346).
- BM auto-offline for resolver mismatches in [`buy-box-check.js`](/home/ricky/builds/backmarket/scripts/buy-box-check.js#L1053).
- BM auto-offline for qty mismatches in [`buy-box-check.js`](/home/ricky/builds/backmarket/scripts/buy-box-check.js#L1085).
- BM price bumping with `--auto-bump` in [`buy-box-check.js`](/home/ricky/builds/backmarket/scripts/buy-box-check.js#L1132).
- Local report write in [`buy-box-check.js`](/home/ricky/builds/backmarket/scripts/buy-box-check.js#L1262).

Crontab readiness:
- Not ready for unattended live scheduling.
- The dry-run/read-only path works.
- Live scheduling is unsafe until the resolver mismatch logic is reviewed, because default non-dry-run behavior can auto-offline listings even without `--auto-bump`.
- The current output also shows multiple “winning” listings with negative net profit, which is a business-risk signal that should be resolved before any automatic action is scheduled.

## 3. `morning-briefing.js`

Script:
- [`morning-briefing.js`](/home/ricky/builds/backmarket/scripts/morning-briefing.js#L1)

Run:
- `node /home/ricky/builds/backmarket/scripts/morning-briefing.js --dry-run`

Exit:
- `0`

Env vars needed from code:
- `BM_AUTH`
- `BM_UA` (optional in code because [`bm-api.js`](/home/ricky/builds/backmarket/scripts/lib/bm-api.js#L1) has a default user-agent)
- `MONDAY_APP_TOKEN`
- `SLACK_BOT_TOKEN` for non-dry-run posting

Observed output:
- Dry-run generated a Slack message with `10` orders in transit.
- All `10` entries landed in `ETA unknown`.
- Every row rendered as `Unknown — Unknown device — BM undefined → Monday: (lookup failed)`.

Observed log output:
- The script successfully fetched `10` SENT orders from BM.
- Every Monday lookup failed with the same GraphQL type error and the lookup key was `undefined`.
- Log file written to `/home/ricky/builds/backmarket/scripts/logs/morning-briefing.log`.

Observed error:

```text
Monday lookup failed for undefined: Monday GQL error: [{"message":"Variable \"$boardId\" of type \"[ID!]!\" used in position expecting type \"ID!\"."},{"message":"Variable \"$value\" of type \"CompareValue!\" used in position expecting type \"String\"."}]
```

Likely failure points:
- `publicId` comes from `order.public_id || order.id` in [`morning-briefing.js`](/home/ricky/builds/backmarket/scripts/morning-briefing.js#L127), but the dry-run output showed `undefined` for every order.
- The Monday query signature in [`lib/monday.js`](/home/ricky/builds/backmarket/scripts/lib/monday.js#L47) is invalid for the endpoint being used, which causes every lookup to fail.

Crontab readiness:
- Not ready.
- If scheduled now, it would post a low-quality Slack briefing with undefined BM IDs and no Monday matches.
- It needs the Monday GraphQL query fixed first, and it likely also needs the correct buyback order identifier field mapped before the message can be trusted.

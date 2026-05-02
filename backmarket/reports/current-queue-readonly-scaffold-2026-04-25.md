# Current Queue Readonly Scaffold - 2026-04-25

## Scope

Added a narrow, quiet current queue scaffold for Back Market clearance-first listing work.

No live Monday/BM read was executed. No live Back Market, Monday, Telegram, Slack, customer, return, warranty, mailbox, browser, or listing mutation was performed.

## Added

- `/home/ricky/builds/backmarket/scripts/current-queue-readonly.js`

## Design

Default mode is plan-only. It performs no network calls unless `--execute-read` is explicitly supplied.

Safety properties:

- no Telegram/Slack code path
- no Monday mutation code path
- no Back Market mutation code path
- no customer/return/warranty path
- JSON output only
- `--execute-read` approval boundary before any Monday read

## Verification

Ran:

```bash
node -c /home/ricky/builds/backmarket/scripts/current-queue-readonly.js
node /home/ricky/builds/backmarket/scripts/current-queue-readonly.js --json
cd /home/ricky/builds/backmarket-browser
npm test
npm run validate:selectors
node -c /home/ricky/builds/royal-mail-automation/dispatch.js
node /home/ricky/builds/royal-mail-automation/dispatch.js --dispatch-match-self-test
```

Result:

```text
current-queue-readonly plan-only output: ok=true, liveRead=false, liveMutation=false, notifications=false
selector-map.test passed
fix-sku.test passed
cs-monitor.test passed
mailbox-code.test passed
mailbox-imap-contract.test passed
mailbox-fetcher.test passed
imap-metadata-fetcher.test passed
runtime-lock.test passed
harness-check.test passed
harness-doctor.test passed
Selector map contract valid
Dispatch match self-test passed
```

## Next

After approval, run the read-only pull:

```bash
node /home/ricky/builds/backmarket/scripts/current-queue-readonly.js \
  --execute-read \
  --json \
  --out /home/ricky/builds/backmarket/reports/current-queue-readonly-YYYY-MM-DD.json
```

Then review schema/column assumptions before any listing action.

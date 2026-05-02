# Current Queue Readonly Unit Test - 2026-04-25

## Scope

Made the narrow current queue scaffold testable and added a unit test for its safety defaults and classification helper.

No live Monday/BM read was executed. No live Back Market, Monday, Telegram, Slack, customer, return, warranty, mailbox, browser, or listing mutation was performed.

## Changed

- `/home/ricky/builds/backmarket/scripts/current-queue-readonly.js`
  - wrapped CLI execution with `if (require.main === module)`
  - exported pure helpers for testing
- `/home/ricky/builds/backmarket/test/unit/current-queue-readonly.test.js`
  - verifies plan-only defaults
  - verifies `liveRead=false`, `liveMutation=false`, `notifications=false`
  - verifies linked-id extraction
  - verifies blocked classification when BM Device or required grade/colour data is missing
  - verifies clearance classification when an existing listing id and SKU are present

## Verification

Ran:

```bash
node -c /home/ricky/builds/backmarket/scripts/current-queue-readonly.js
node /home/ricky/builds/backmarket/test/unit/current-queue-readonly.test.js
node /home/ricky/builds/backmarket/scripts/current-queue-readonly.js --json
cd /home/ricky/builds/backmarket-browser
npm test
npm run validate:selectors
node -c /home/ricky/builds/royal-mail-automation/dispatch.js
node /home/ricky/builds/royal-mail-automation/dispatch.js --dispatch-match-self-test
```

Result:

```text
current-queue-readonly.test passed
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

The script is ready for an approval-gated read-only Monday queue pull via `--execute-read`, followed by column/schema review before any listing action.
